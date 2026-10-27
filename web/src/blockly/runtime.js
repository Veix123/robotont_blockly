export function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Stopped', 'AbortError'));
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Stopped', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export class Runner {
  constructor(robot, { onLog = () => {}, onStep = () => {} } = {}) {
    this.robot = robot;
    this.onLog = onLog;
    this.onStep = onStep;
    this.running = false;
  }
  stop() {
    this.controller?.abort();
    return this.robot.stop();
  }
  async run(program) {
    if (this.running) throw new Error('A program is already running.');
    this.running = true;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    let steps = 0;
    const checkStep = () => {
      if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
      if (++steps > 10000) throw new Error('Program step limit reached. Try fewer repetitions.');
    };
    const evaluate = async (v) => {
      if (v.op === 'number' || v.op === 'boolean') return v.value;
      if (v.op === 'distance') return this.robot.distance(v.direction);
      if (v.op === 'compare') {
        const a = await evaluate(v.a),
          b = await evaluate(v.b);
        switch (v.operator) {
          case 'LT':
            return a < b;
          case 'LTE':
            return a <= b;
          case 'GT':
            return a > b;
          case 'GTE':
            return a >= b;
          case 'EQ':
            return a === b;
          case 'NEQ':
            return a !== b;
        }
      }
      throw new Error('Unknown expression.');
    };
    const execute = async (body) => {
      for (const cmd of body) {
        checkStep();
        this.onStep(cmd.id);
        switch (cmd.op) {
          case 'move':
          case 'turn':
            this.onLog(
              `${cmd.op === 'move' ? 'Moving' : 'Turning'} ${cmd.direction} for ${cmd.seconds} s`,
            );
            if (cmd.op === 'move') {
              this.robot.move(cmd.direction, cmd.speed);
            } else {
              this.robot.turn(cmd.direction, cmd.speed);
            }
            try {
              await delay(cmd.seconds * 1000, signal);
            } finally {
              if (!signal.aborted) await this.robot.stop();
            }
            break;
          case 'wait':
            await delay(cmd.seconds * 1000, signal);
            break;
          case 'stop':
            await this.robot.stop();
            this.onLog('Motion stopped');
            break;
          case 'led':
            await this.robot.led(cmd.side, cmd.color);
            this.onLog(`${cmd.side} LEDs updated`);
            break;
          case 'repeat': {
            const times = await evaluate(cmd.times);
            if (!Number.isInteger(times) || times < 0 || times > 100)
              throw new Error('Repeat needs a whole number from 0 to 100.');
            for (let i = 0; i < times; i++) {
              await delay(0, signal);
              await execute(cmd.body);
            }
            break;
          }
          case 'while':
            while (Boolean(await evaluate(cmd.condition)) !== cmd.until) {
              checkStep();
              // Yield even for an empty body so Stop/disconnect can interrupt it.
              await delay(0, signal);
              await execute(cmd.body);
            }
            break;
          case 'if': {
            let selected = cmd.otherwise;
            for (const branch of cmd.branches)
              if (await evaluate(branch.condition)) {
                selected = branch.body;
                break;
              }
            await execute(selected);
            break;
          }
          default:
            throw new Error('Unknown program step.');
        }
      }
    };
    try {
      await execute(program);
      this.onLog('Program finished');
      return 'finished';
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
      this.onLog('Program stopped');
      return 'stopped';
    } finally {
      try {
        if (!signal.aborted) await this.robot.stop();
      } finally {
        this.running = false;
        this.onStep(null);
      }
    }
  }
}
