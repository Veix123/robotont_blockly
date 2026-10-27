// Stand-alone sensor view (3D + camera), also embedded by the Blockly page.
import { RobotConnection } from './ros_connection.js';
import { RobotViewer } from './viewer.js';

const connection = new RobotConnection();
const element = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const viewer = new RobotViewer(element('scene'), connection);
const render = () => {
  element('robot').replaceChildren(
    ...connection.robots.map((robot) => {
      const option = document.createElement('option');
      option.value = robot.ns;
      option.textContent = robot.name + (robot.ns ? ` (${robot.ns})` : '');
      option.selected = robot.ns === connection.selected;
      return option;
    }),
  );
  element('robot').hidden = params.has('fixed');
  element('msg').textContent = connection.connected
    ? connection.robot
      ? ''
      : 'No robot found'
    : 'Connecting to rosbridge…';
};
connection.addEventListener('robots', () => {
  const wanted = params.get('robot');
  if (
    wanted !== null &&
    connection.selected !== wanted &&
    connection.robots.some((robot) => robot.ns === wanted)
  )
    connection.select(wanted);
});
element('robot').onchange = () => connection.select(element('robot').value);
element('follow').onclick = () => viewer.follow();
element('top').onclick = () => viewer.topDown();
for (const name of ['connection', 'robots', 'select']) connection.addEventListener(name, render);
render();
