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

    // TODO: Manage games
    const game = new GameState(8, 8, [{code: 'this.shoot(0, this.location); this.finalize_moves();'}, {code: 'this.shoot(0, this.location); this.finalize_moves();'}]);
    game.runMatch().then(frames => {
        console.log(frames);
        // TODO: render game
    });
};
