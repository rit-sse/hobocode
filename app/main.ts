
import * as PIXI from 'pixi.js';
import RobotProxy from './robotproxy';
window.onload = init; 


function init(){


	var renderer = new PIXI.autoDetectRenderer(800, 600, {backgroundColor : 0x1099bb, view : document.getElementById("maincanvas")});
	document.body.appendChild(renderer.view);

	// create the root of the scene graph
	var stage = new PIXI.Container();

	// start animating
	animate();
	function animate() {
	    requestAnimationFrame(animate);

	    // render the container
	    renderer.render(stage);
	}
}
