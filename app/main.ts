import * as PIXI from 'pixi.js';
import RobotProxy from './robotproxy';
import {GameState} from './gamestate';
import * as wire from './wire';

window.onload = function() {
    const renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor : 0x1099bb, view : document.getElementById('maincanvas') as HTMLCanvasElement});
    document.body.appendChild(renderer.view);

    // create the root of the scene graph
    const stage = new PIXI.Container();

    const gridTexture = PIXI.Texture.fromImage('square.png');
    const tiled = new PIXI.extras.TilingSprite(gridTexture, 800, 600);
    stage.addChild(tiled);

    // start animating
    animate();
    function animate() {
        requestAnimationFrame(animate);

        // render the container
        renderer.render(stage);
    }

    const testbot: wire.RobotData = {location: {x: 4, y: 4}, name: 'test'};
    new GameState(8, 8, [new RobotProxy([testbot], '', {x: 8, y: 8})]);
};
