// The blockly package entry brings in the standard blocks and English messages.
import * as Blockly from 'blockly';
export const directions = ['front', 'back', 'left', 'right'];
const colors = [
  ['teal', '#12b8a6'],
  ['red', '#ef6461'],
  ['blue', '#4388f3'],
  ['yellow', '#f7c847'],
  ['white', '#ffffff'],
  ['off', '#000000'],
];
const number = (name, value, min, max) => ({
  type: 'field_number',
  name,
  value,
  min,
  max,
});
const definitions = [
  {
    type: 'robot_start',
    message0: 'when Run is pressed %1 %2',
    args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }],
    colour: 45,
  },
  {
    type: 'robot_move',
    message0: 'move %1 at %2 m/s for %3 seconds',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DIRECTION',
        options: directions.map((d) => [d, d]),
      },
      number('SPEED', 0.15, 0.01, 0.3),
      number('SECONDS', 1, 0.05, 30),
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 165,
  },
  {
    type: 'robot_turn',
    message0: 'turn %1 at %2 rad/s for %3 seconds',
    args0: [
      {
        type: 'field_dropdown',
        name: 'DIRECTION',
        options: [
          ['left', 'left'],
          ['right', 'right'],
        ],
      },
      number('SPEED', 0.5, 0.05, 1),
      number('SECONDS', 1, 0.05, 30),
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 165,
  },
  {
    type: 'robot_stop',
    message0: 'stop moving',
    previousStatement: null,
    nextStatement: null,
    colour: 165,
  },
  {
    type: 'robot_wait',
    message0: 'wait %1 seconds',
    args0: [number('SECONDS', 1, 0.05, 30)],
    previousStatement: null,
    nextStatement: null,
    colour: 35,
  },
  ...directions.map((d) => ({
    type: `obstacle_distance_${d}`,
    message0: `obstacle distance ${d} (m)`,
    output: 'Number',
    colour: 215,
  })),
  ...[...directions, 'all'].map((d) => ({
    type: `led_${d}`,
    message0: `LED ${d} %1`,
    args0: [{ type: 'field_dropdown', name: 'COLOR', options: colors }],
    previousStatement: null,
    nextStatement: null,
    colour: 315,
  })),
];
Blockly.common.defineBlocksWithJsonArray(definitions);

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Events',
      colour: '45',
      contents: [{ kind: 'block', type: 'robot_start' }],
    },
    {
      kind: 'category',
      name: 'Motion',
      colour: '165',
      contents: ['robot_move', 'robot_turn', 'robot_stop'].map((type) => ({
        kind: 'block',
        type,
      })),
    },
    {
      kind: 'category',
      name: 'Obstacle detection',
      colour: '215',
      contents: directions.map((d) => ({
        kind: 'block',
        type: `obstacle_distance_${d}`,
      })),
    },
    {
      kind: 'category',
      name: 'LEDs',
      colour: '315',
      contents: [...directions, 'all'].map((d) => ({
        kind: 'block',
        type: `led_${d}`,
      })),
    },
    {
      kind: 'category',
      name: 'Logic',
      colour: '35',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {
            TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } },
          },
        },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'robot_wait' },
      ],
    },
  ],
};

const chain = (blocks) =>
  blocks.reduceRight(
    (next, block) => ({ ...block, ...(next ? { next: { block: next } } : {}) }),
    null,
  );
const led = (side, color) => ({
  type: `led_${side}`,
  fields: { COLOR: color },
});
export function example(name) {
  const body =
    name === 'lights'
      ? [
          led('all', '#4388f3'),
          { type: 'robot_wait', fields: { SECONDS: 0.5 } },
          led('front', '#ef6461'),
          led('back', '#f7c847'),
          led('left', '#12b8a6'),
          led('right', '#ffffff'),
        ]
      : name === 'obstacle'
        ? [
            {
              type: 'controls_if',
              inputs: {
                IF0: {
                  block: {
                    type: 'logic_compare',
                    fields: { OP: 'LT' },
                    inputs: {
                      A: { block: { type: 'obstacle_distance_front' } },
                      B: {
                        shadow: { type: 'math_number', fields: { NUM: 0.8 } },
                      },
                    },
                  },
                },
                DO0: { block: { type: 'robot_stop' } },
                ELSE: {
                  block: {
                    type: 'robot_move',
                    fields: { DIRECTION: 'front', SPEED: 0.1, SECONDS: 0.5 },
                  },
                },
              },
              extraState: { hasElse: true },
            },
          ]
        : [
            {
              type: 'robot_move',
              fields: { DIRECTION: 'front', SPEED: 0.15, SECONDS: 1 },
            },
            {
              type: 'robot_turn',
              fields: { DIRECTION: 'left', SPEED: 0.5, SECONDS: 1 },
            },
            { type: 'robot_stop' },
          ];
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'robot_start',
          x: 35,
          y: 35,
          inputs: { DO: { block: chain(body) } },
        },
      ],
    },
  };
}

export { Blockly };
