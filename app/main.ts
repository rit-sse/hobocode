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
    const energyTexture = PIXI.Texture.fromImage('energy.png');
    
    let range10 = [0,1,2,3,4,5,6,7,8,9,10];
    let healthTextures : PIXI.Texture[] = [];
    let energyTextures : PIXI.Texture[] = [];
    range10.forEach(num => {
        let ht = PIXI.Texture.fromImage(`health${num}.png`);
        let et = PIXI.Texture.fromImage(`energy${num}.png`);
        healthTextures.push(ht);
        energyTextures.push(et);
    });

    let robotSprites: {[id: string]: PIXI.Sprite} = {};
    let shotsFired : PIXI.Sprite[] = [];
    let fieldEnergy : PIXI.Sprite[] = [];
    
    const tiled = new PIXI.extras.TilingSprite(gridTexture, tileSize[0]*boardSize[0], tileSize[1]*boardSize[1]);
    tiled.interactive = true;

    let gameStateFrames: GameFrame[];
    let currentFrame = 0;

    // add text to show the current frame
    const frameText = new PIXI.Text(`Frame ${currentFrame}`);
    frameText.x = 0;
    frameText.y = tileSize[1] * boardSize[1];
    stage.addChild(frameText);

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
        graphics.clear();
        
        stage.children.forEach(child => {
            if(child.name === "health" ) {
                child.visible = false;
                stage.removeChild(child);
            }
            if(child.name === "energy") {
                child.visible = false;
                stage.removeChild(child);
            }
        });
        
        //Clear Shots Sprites
        shotsFired = shotsFired.filter(shot => {
           stage.removeChild(shot);
           return false; 
        });

        fieldEnergy = fieldEnergy.filter(energy => {
            stage.removeChild(energy);
            return false;
        });

        gameStateFrames[currentFrame].regens.map(regen => {
            let energySprite = new PIXI.Sprite(energyTexture);
            stage.addChild(energySprite);
            energySprite.position.x = (regen.location.x * tileSize[0]);
            energySprite.position.y = (regen.location.y * tileSize[1]);
            fieldEnergy.push(energySprite);
        });
        
        //Robots
        gameStateFrames[currentFrame].robots.map(robot => {
            if(robot.health > 0) {
                robotSprites[robot.name].position.x = robot.location.x * tileSize[0];
                robotSprites[robot.name].position.y = robot.location.y * tileSize[1];
                let hTexture = healthTextures[Math.round(robot.health/2)];
                let healthSprite = new PIXI.Sprite(hTexture);
                
                healthSprite.position.x = robot.location.x * tileSize[0];
                healthSprite.position.y = robot.location.y * tileSize[1];
                healthSprite.name = "health";
                stage.addChild(healthSprite);
                
                let e = 0;
                robot.energy > 20 ? e = 20 : e = robot.energy;
                let eTexture = energyTextures[Math.round(e/3)];
                let energySprite = new PIXI.Sprite(eTexture);

                energySprite.position.x = robot.location.x * tileSize[0];
                energySprite.position.y = robot.location.y * tileSize[1];
                energySprite.name = "energy";
                stage.addChild(energySprite);
                
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
