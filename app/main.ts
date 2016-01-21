import * as PIXI from 'pixi.js';
import RobotProxy from './robotproxy';
import {GameState, GameFrame} from './gamestate';
import { RobotGameObject, RegenGameObject } from './gameobjects';
import * as wire from './wire';

window.onload = function() {
    
    // define the size of the grid tiles, and how many spaces we want
    const tileSize = [32, 32];
    const boardSize = [8, 8];

    // grab the window size for the canvas
    const winWidth = innerWidth;
    const winHeight = innerHeight;

    const renderer = PIXI.autoDetectRenderer(winWidth, winHeight, {backgroundColor : 0xFFFFFF, view : document.getElementById('maincanvas') as HTMLCanvasElement});
    document.body.appendChild(renderer.view);

    // create the root of the scene graph
    const stage = new PIXI.Container();

    //Load Base Textures
    const gridTexture = PIXI.Texture.fromImage('square.png');
    const robotTexture = PIXI.Texture.fromImage('robot.png');
    const shotTexture = PIXI.Texture.fromImage('shot.png');
    
    let robotSprites: {[id: string]: PIXI.Sprite} = {};
    let shotsFired : PIXI.Sprite[] = [];
    
    const tiled = new PIXI.extras.TilingSprite(gridTexture, tileSize[0]*boardSize[0], tileSize[1]*boardSize[1]);
    tiled.interactive = true;

    let gameStateFrames: GameFrame[];
    let currentFrame = 0;

    // add text to show the current frame
    const frameText = new PIXI.Text(`Frame ${currentFrame}`);
    frameText.x = 0;
    frameText.y = tileSize[1] * boardSize[1];
    stage.addChild(frameText);

    // Add text for showing robot health
    const healthText = new PIXI.Text('');
    healthText.x = 0;
    healthText.y = frameText.y + 36;
    stage.addChild(healthText);

    //Add text for showing robot energy
    const energyText = new PIXI.Text('');
    energyText.x = 0;
    energyText.y = healthText.y + 72;
    stage.addChild(energyText);

    function updateFrame(){
        if (gameStateFrames[currentFrame + 1] !== undefined) {
            currentFrame++;
            renderFrame();
        }
        else {
            console.error('No more frames to render');
            frameText.text = `Last Frame: ${currentFrame}`;

        } 
    }

    // move game frames forward by clicking on the tiles
    tiled.on('click', () => {
      updateFrame();
    });
    stage.addChild(tiled);

    // define graphics object
    const graphics = new PIXI.Graphics();
    stage.addChild(graphics);
       
    function generateRobotSprites(robots: RobotGameObject[]) {
        robots.map(robot => {
            const sprite = new PIXI.Sprite(robotTexture);
            stage.addChild(sprite);
            robotSprites[robot.name] = sprite; 
        });
    }

    function renderFrame() {
        console.log(gameStateFrames[currentFrame]);
        graphics.clear();
        //Clear Shots Sprites
        shotsFired = shotsFired.filter(shot => {
           stage.removeChild(shot);
           return false; 
        });

        graphics.beginFill(0x0000FF); // make regens blue
        gameStateFrames[currentFrame].regens.map(regen => {
            graphics.drawRect(regen.location.x * tileSize[0],
                              regen.location.y * tileSize[1],
                              tileSize[0], tileSize[1]);
        });
        
        //Robots
        gameStateFrames[currentFrame].robots.map(robot => {
            if(robot.health >= 0) {
                robotSprites[robot.name].position.x = robot.location.x * tileSize[0];
                robotSprites[robot.name].position.y = robot.location.y * tileSize[1];
            } else {
                stage.removeChild(robotSprites[robot.name]);
            }
        });
        
        //Shots
        gameStateFrames[currentFrame].shots_fired.map(shot => {
            let shotsSprite = new PIXI.Sprite(shotTexture);
            stage.addChild(shotsSprite);
     
            shotsSprite.position.x = (shot.to.x * tileSize[0]);
            shotsSprite.position.y = (shot.to.y * tileSize[1]);
            shotsFired.push(shotsSprite);
        });

        frameText.text = `Frame ${currentFrame}`;
        healthText.text = 'Health: \n' + gameStateFrames[currentFrame].robots.map(robot => {
            return `${robot.name} : ${robot.health}`;
        }).join(' ; ');
        energyText.text = 'Energy: \n' + gameStateFrames[currentFrame].robots.map(robot => {
            return `${robot.name} : ${robot.energy}`;
        }).join(' ; ');
    }

    // start animating
    function animate() {
        requestAnimationFrame(animate);

        if (gameStateFrames) {
            // render the container
            renderer.render(stage);
        }
    }
    animate();

    // TODO: Manage 
    const complexRandomBot = `
        var _this = this;
        function shootAtRandomBot() {
            var bot = _this.inView.robots.sort(function(){ return Math.random(); })[0];
            var opt = Math.random();
            if (opt > 0.7) {
                // Add some variance to shots
                var num = Math.floor((opt * 10) % 3) - 1;
                var num2 = Math.floor((opt * 100) % 3) - 1;
                _this.shoot(0, {x: bot.location.x + num, y: bot.location.y + num2});
            }
            else {
                _this.shoot(0, bot.location);
            }
        }
        function moveTowardClosestRegen() {
            // Move towards the regen
            var x = _this.location.x;
            var y = _this.location.y;
            var location = _this.inView.regens
              .map(function(r){return r.location;})
              .sort(function(l) { return Math.sqrt(Math.pow(l.x - x, 2)+Math.pow(l.y - y, 2)); })[0];
            if (location.x < x) {
                _this.move_west();
                _this.location.x--;
            }
            else if (x < location.x) {
                _this.move_east();
                _this.location.x++;
            }
            else if (location.y < y) {
                _this.move_north();
                _this.location.y--;
            }
            else if (y < location.y) {
                _this.move_south();
                _this.location.y++;
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
        for (var i=1; i<=3; i++) {
            if (this.inView.robots.length && this.inView.regens.length){
                var opt = Math.random();
                if (opt < 0.2) {
                    shootAtRandomBot();
                }
                else {
                    moveTowardClosestRegen();
                }
            }
            else if (this.inView.regens.length) {
                moveTowardClosestRegen();
            }
            else if (this.inView.robots.length) {
                shootAtRandomBot();
            }
            else {
                debugger;
                moveRandomly();
            }
        }
        this.finalize_moves();
    `;
    const game = new GameState(boardSize[0], boardSize[1], [{code: complexRandomBot}, {code: complexRandomBot}]);
    generateRobotSprites(game.entities.robots);
    
    game.runMatch().then(frames => {
        gameStateFrames = frames;
        renderFrame();
    });
};
