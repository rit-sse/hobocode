import * as PIXI from 'pixi.js';
import RobotProxy from './robotproxy';
import {GameState, GameFrame} from './gamestate';
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

    let gameStateFrames: GameFrame[];
    let currentFrame = 0;

    // move game frames forward by clicking on the tiles
    tiled.on('click', () => {
      if (gameStateFrames[currentFrame + 1] !== undefined) {
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
    frameText.y = tileSize[1] * boardSize[1];
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
            graphics.drawRect(shot.to.x * tileSize[0],
                              shot.to.y * tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        graphics.beginFill(0x0000FF); // make regens blue
        gameStateFrames[currentFrame].regens.map(regen => {
            graphics.drawRect(regen.location.x * tileSize[0],
                              regen.location.y * tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        graphics.beginFill(0x00FF00); // make robots green
        gameStateFrames[currentFrame].robots.map(robot => {
            graphics.drawRect(robot.location.x * tileSize[0],
                              robot.location.y * tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        stage.addChild(graphics);

        // render the container
        renderer.render(stage);
    }

    // TODO: Manage 
    const complexRandomBot = `
        var _this = this;
        function shootAtRandomBot() {
            var bot = _this.inView.robots.sort(function(){ return Math.random(); })[0];
            var opt = Math.random();
            if (opt > 0.7) {
                // Add some variance to shots
                var num = (opt * 10) % 3 - 1;
                var num2 = (opt * 100) % 3 - 1;
                _this.shoot(0, {x: bot.location.x + num, y: bot.location.y + num2});
            }
            else {
                _this.shoot(0, bot.location);
            }
        }
        function moveTowardClosestRegen() {
            // Move towards the regen
            var x = this.location.x;
            var y = this.location.y;
            var location = _this.inView.regens.slice(0).sort(function(r) { return Math.sqrt(); })[0];
            if (location.x < x) {
                _this.move_west();
            }
            else if (x < location.x) {
                _this.move_east();
            }
            else if (location.y < y) {
                _this.move_south();
            }
            else if (y < location.y) {
                _this.move_north();
            }
        }
        function moveRandomly() {
            var opt = Math.random() * 100;
            if (opt < 25) {
                _this.move_west();
            }
            else if (opt < 50) {
                _this.move_east();
            }
            else if (opt < 75) {
                _this.move_south();
            }
            else {
                _this.move_north();
            }
        }
        for (var i=1; i<3; i++) {
            if (this.inView.robots.length  && this.inView.regens.length){
                var opt = Math.random();
                if (opt > 0.6) {
                    shootAtRandomBot();
                }
                else {
                    moveTowardClosestRegen();
                }
            }
            else if (this.inView.robots.length) {
                shootAtRandomBot();
            }
            else if (this.inView.regens.length) {
                moveTowardClosestRegen();
            }
            else {
                moveRandomly();
            }
        }
        this.finalize_moves();
    `;
    const game = new GameState(boardSize[0], boardSize[1], [{code: complexRandomBot}, {code: complexRandomBot}]);
    game.runMatch().then(frames => {
        gameStateFrames = frames;
        animate();
    });
};
