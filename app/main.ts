import * as PIXI from 'pixi.js';
import RobotProxy from './robotproxy';
import {GameState} from './gamestate';
import * as wire from './wire';

window.onload = function() {
    // grab the window size for the canvas
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    // define the size of the grid tiles, and how many spaces we want
    const tileSize = [32, 32];
    const boardSize = [8, 8];

    const renderer = PIXI.autoDetectRenderer(winWidth, winHeight, {backgroundColor : 0x1099bb, view : document.getElementById('maincanvas') as HTMLCanvasElement});
    document.body.appendChild(renderer.view);

    // create the root of the scene graph
    const stage = new PIXI.Container();

    const gridTexture = PIXI.Texture.fromImage('square.png');
    const tiled = new PIXI.extras.TilingSprite(gridTexture, tileSize[0]*boardSize[0], tileSize[1]*boardSize[1]);
    tiled.interactive = true;

    let gameStateFrames;
    let currentFrame = 0;

    // move game frames forward by clicking on the tiles
    tiled.on('click', () => {
      if (gameStateFrames[currentFrame+1] !== undefined) {
          currentFrame++;
          frameText.text = `Frame ${currentFrame}`;
      }
      else {
          console.error('No more frames to render');
          frameText.text = `Last Frame: ${currentFrame}`;
      }
    });
    stage.addChild(tiled);

    // add text to show the current frame
    const frameText = new PIXI.Text(`Frame ${currentFrame}`);
    frameText.x = 0;
    frameText.y = tileSize[1]*boardSize[1];
    stage.addChild(frameText);

    // define graphics object
    const graphics = new PIXI.Graphics();

    // start animating
    function animate() {
        requestAnimationFrame(animate);

        /* we should probably not be making these graphics objects
            in the animate loop, don't know how this can be revised,
            but it works for now */
        graphics.beginFill(0xFF0000); // make shots red
        gameStateFrames[currentFrame].shots_fired.map(shot => {
            graphics.drawRect(shot.to.x*tileSize[0],
                              shot.to.y*tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        graphics.beginFill(0x0000FF); // make regens blue
        gameStateFrames[currentFrame].regens.map(regen => {
            graphics.drawRect(regen.location.x*tileSize[0],
                              regen.location.y*tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        graphics.beginFill(0x00FF00); // make robots green
        gameStateFrames[currentFrame].robots.map(robot => {
            graphics.drawRect(robot.location.x*tileSize[0],
                              robot.location.y*tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        stage.addChild(graphics);

        // render the container
        renderer.render(stage);
    }

    // TODO: Manage games
    const game = new GameState(boardSize[0], boardSize[1], [{code: 'this.shoot(0, this.location); this.finalize_moves();'}, {code: 'this.shoot(0, this.location); this.finalize_moves();'}]);
    game.runMatch().then(frames => {
        gameStateFrames = frames;
        animate();
    });
};
