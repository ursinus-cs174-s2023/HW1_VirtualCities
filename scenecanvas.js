const RADIAL_SEGMENTS = 32; // For spheres, cylinders, and cones
const BEACON_SIZE = 0.1; // For point lights

function getMaterialPrefix(r, g, b, roughness, metalness) {
    return r + "_" + g + "_" + b + "_" + roughness + "_" + metalness;
}

/**
 * Convert a hex color string to an array of floating point numbers in [0, 1]
 * 
 * @param {string} s 6 character string
 */
function colorFloatFromHex(s) {
    let r = parseInt(s.substring(0, 2), 16)/255.0;
    let g = parseInt(s.substring(2, 4), 16)/255.0;
    let b = parseInt(s.substring(4, 6), 16)/255.0;
    return [r, g, b];
}

function setObjectPosRot(obj, x, y, z, rx, ry, rz) {
    obj.position.x = x;
    obj.position.y = y;
    obj.position.z = z;
    obj.rotation.x = rx*Math.PI/180;
    obj.rotation.y = ry*Math.PI/180;
    obj.rotation.z = rz*Math.PI/180;
}

function setObjectScale(obj, sx, sy, sz) {
    obj.scale.x = sx;
    obj.scale.y = sy;
    obj.scale.z = sz;
}

class SceneCanvas {
    constructor(winFac) {
        if (winFac === undefined) {
            winFac = 0.8;
        }
        
        this.materials = {};
        const renderer = new THREE.WebGLRenderer({antialias:true});
        const W = Math.round(window.innerWidth*winFac);
        const H = Math.round(window.innerHeight*winFac);
        this.W = W;
        this.H = H;
        renderer.setSize(W, H);

        const scene = new THREE.Scene();
        this.scene = scene;
        const camera = new FPSCamera(W, H);
        this.cameras = [camera];
        this.camera = camera;

        document.body.appendChild(renderer.domElement);
        this.glcanvas = renderer.domElement;
        this.renderer = renderer;
        this.initializeCallbacks();
        this.setupMenus();
    }


    /**
     * Initialize the mouse/keyboard callbacks and relevant variables
     */
    initializeCallbacks() {
        // Mouse variables
        this.lastX = 0;
        this.lastY = 0;
        this.dragging = false;
        this.justClicked = false;
        this.invertYAxis = false;
        this.clickType = "LEFT";
        
        // Keyboard variables
        this.walkspeed = 2.5;//How many meters per second
        this.lastTime = (new Date()).getTime();
        this.movelr = 0;//Moving left/right
        this.movefb = 0;//Moving forward/backward
        this.moveud = 0;//Moving up/down

        const glcanvas = this.glcanvas;
        glcanvas.addEventListener('mousedown', this.makeClick.bind(this));
        glcanvas.addEventListener('mouseup', this.releaseClick.bind(this));
        glcanvas.addEventListener('mousemove', this.clickerDragged.bind(this));
        glcanvas.addEventListener('mouseout', this.mouseOut.bind(this));

        //Support for mobile devices
        glcanvas.addEventListener('touchstart', this.makeClick.bind(this));
        glcanvas.addEventListener('touchend', this.releaseClick.bind(this));
        glcanvas.addEventListener('touchmove', this.clickerDragged.bind(this));

        //Keyboard listener
        this.keysDown = {87:false, 83:false, 65:false, 68:false, 67:false, 69:false};
        document.addEventListener('keydown', this.keyDown.bind(this), true);
        document.addEventListener('keyup', this.keyUp.bind(this), true);
    }


    /////////////////////////////////////////////////////
    //                MOUSE CALLBACKS                  //
    /////////////////////////////////////////////////////

    /**
     * Extract x/y position from a mouse event
     * @param {mouse event} evt 
     * @returns {object} The X/Y coordinates
     */
    getMousePos(evt) {
        if ('touches' in evt) {
            return {
                X: evt.touches[0].clientX,
                Y: evt.touches[1].clientY
            }
        }
        return {
            X: evt.clientX,
            Y: evt.clientY
        };
    }
    
    /**
     * React to a click being released
     * @param {mouse event} evt 
     */
    releaseClick(evt) {
        evt.preventDefault();
        this.dragging = false;
        if (this.repaintOnInteract) {
            requestAnimFrame(this.repaint.bind(this));
        }
        return false;
    } 

    /**
     * React to a mouse leaving the window
     * @param {mouse event} evt 
     */
    mouseOut(evt) {
        this.dragging = false;
        if (this.repaintOnInteract) {
            requestAnimFrame(this.repaint.bind(this));
        }
        return false;
    }
    
    /**
     * React to a click happening
     * @param {mouse event} e
     */
    makeClick(e) {
        let evt = (e == null ? event:e);
        this.clickType = "LEFT";
        evt.preventDefault();
        if (evt.which) {
            if (evt.which == 3) this.clickType = "RIGHT";
            if (evt.which == 2) this.clickType = "MIDDLE";
        }
        else if (evt.button) {
            if (evt.button == 2) this.clickType = "RIGHT";
            if (evt.button == 4) this.clickType = "MIDDLE";
        }
        this.dragging = true;
        this.justClicked = true;
        let mousePos = this.getMousePos(evt);
        this.lastX = mousePos.X;
        this.lastY = mousePos.Y;
        if (this.repaintOnInteract) {
            requestAnimFrame(this.repaint.bind(this));
        }
        return false;
    } 

    /**
     * React to a mouse being dragged
     * @param {mouse event} evt 
     */
    clickerDragged(evt) {
        evt.preventDefault();
        let mousePos = this.getMousePos(evt);
        let dX = mousePos.X - this.lastX;
        let dY = mousePos.Y - this.lastY;
        this.lastX = mousePos.X;
        this.lastY = mousePos.Y;
        if (this.camera === null) {
            return;
        }
        if (this.dragging && this.camera.type == "polar") {
            //Translate/rotate shape
            if (this.clickType == "MIDDLE") {
                this.camera.translate(dX, -dY);
            }
            else if (this.clickType == "RIGHT") { //Right click
                this.camera.zoom(dY); //Want to zoom in as the mouse goes up
            }
            else if (this.clickType == "LEFT") {
                this.camera.orbitLeftRight(dX);
                this.camera.orbitUpDown(-dY);
            }
            if (this.repaintOnInteract) {
                requestAnimFrame(this.repaint.bind(this));
            }
        }
        else if (this.dragging && this.camera.type == "fps") {
            //Rotate camera by mouse dragging
            this.camera.rotateLeftRight(-dX);
            if (this.invertYAxis) {
                this.camera.rotateUpDown(dY);
            }
            else {
                this.camera.rotateUpDown(-dY);
            }
            let noKeysPressing = true;
            for (let name in this.keysDown) {
                if (Object.prototype.hasOwnProperty.call(this.keysDown, name)) {
                    if (this.keysDown[name]) {
                        noKeysPressing = false;
                        break;
                    }
                }
            }
            if (noKeysPressing && this.repaintOnInteract) {
                requestAnimFrame(this.repaint.bind(this));
            }
        }
        return false;
    }

    /////////////////////////////////////////////////////
    //             KEYBOARD CALLBACKS                  //
    /////////////////////////////////////////////////////

    /**
     * React to a key being pressed
     * @param {keyboard callback} evt 
     */
    keyDown(evt) {
        let newKeyDown = false;
        if (evt.keyCode == 87) { //W
            if (!this.keysDown[87]) {
                newKeyDown = true;
                this.keysDown[87] = true;
                this.movefb = 1;
            }
        }
        else if (evt.keyCode == 83) { //S
            if (!this.keysDown[83]) {
                newKeyDown = true;
                this.keysDown[83] = true;
                this.movefb = -1;
            }
        }
        else if (evt.keyCode == 65) { //A
            if (!this.keysDown[65]) {
                newKeyDown = true;
                this.keysDown[65] = true;
                this.movelr = -1;
            }
        }
        else if (evt.keyCode == 68) { //D
            if (!this.keysDown[68]) {
                newKeyDown = true;
                this.keysDown[68] = true;
                this.movelr = 1;
            }
        }
        else if (evt.keyCode == 67) { //C
            if (!this.keysDown[67]) {
                newKeyDown = true;
                this.keysDown[67] = true;
                this.moveud = -1;
            }
        }
        else if (evt.keyCode == 69) { //E
            if (!this.keysDown[69]) {
                newKeyDown = true;
                this.keysDown[69] = true;
                this.moveud = 1;
            }
        }
        this.lastTime = (new Date()).getTime();
        if (newKeyDown && this.repaintOnInteract) {
            requestAnimFrame(this.repaint.bind(this));
        }
    }
    
    /**
     * React to a key being released
     * @param {keyboard callback} evt 
     */
    keyUp(evt) {
        if (evt.keyCode == 87) { //W
            this.movefb = 0;
            this.keysDown[87] = false;
        }
        else if (evt.keyCode == 83) { //S
            this.movefb = 0;
            this.keysDown[83] = false;
        }
        else if (evt.keyCode == 65) { //A
            this.movelr = 0;
            this.keysDown[65] = false;
        }
        else if (evt.keyCode == 68) { //D
            this.movelr = 0;
            this.keysDown[68] = false;
        }
        else if (evt.keyCode == 67) { //C
            this.moveud = 0;
            this.keysDown[67] = false;
        }
        else if (evt.keyCode == 69) { //E
            this.moveud = 0;
            this.keysDown[69] = false;
        }
    }   

    /////////////////////////////////////////////////////
    //                    MENUS                        //
    /////////////////////////////////////////////////////

    /**
     * Setup the dat.GUI menus
     */
    setupMenus() {
        const canvas = this;
        this.gui = new dat.GUI();
        const gui = this.gui;
        // Title
        this.name = "Untitled Scene";
        gui.add(this, "name").listen();
        
        this.setupAnimationMenu();

        // Lighting menu
        this.lightMenu = gui.addFolder('Lights');
        this.lightMenus = []; // Individual menus for each light
        this.showLights = true;
        this.lightMenu.add(canvas, 'showLights');

        // Camera control menu
        this.cameraMenu = gui.addFolder('Cameras');
        this.cameraMenus = []; // Individual menus for each camera
        let cameraMenu = this.cameraMenu;
        this.showCameras = true;
        cameraMenu.add(canvas, 'showCameras');
        this.invertYAxis = false;
        cameraMenu.add(canvas, 'invertYAxis');

        // Other options
        this.walkspeed = 2.6;
        gui.add(canvas, 'walkspeed', 0.01, 100);
    }


    /**
     * Setup the animation menu in dat.gui
     */
    setupAnimationMenu() {
        let gui = this.gui;
        let canvas = this;
        this.animationMenu = gui.addFolder("Animation");
        this.animation = {framesPerStep:50, framesPerSec: 30, interpolation:'slerp', cameraSequence:''};
        this.animationMenu.add(this.animation, "cameraSequence").listen();
        this.animationMenu.add(this.animation, 'framesPerStep');
        this.animationMenu.add(this.animation, 'framesPerSec');
        this.animationMenu.add(this.animation, 'interpolation', ['slerp', 'euler']);
        this.animating = false;
        this.MakeGIF = function() {
            let a = canvas.animation;
            a.frame = 0;
            let c = this.camera;
            a.sequence = a.cameraSequence.split(",");

            if (a.sequence.length < 2) {
                alert("Animation Error: Must have at least two cameras in the camera sequence!");
            }
            else {
                let valid = true;
                for (let i = 0; i < a.sequence.length; i++) {
                    a.sequence[i] = parseInt(a.sequence[i]);
                    if (a.sequence[i] >= this.scene.cameras.length) {
                        alert("Animation Error: Camera " + a.sequence[i] + " does not exist!");
                        valid = false;
                    }
                }
                if (valid) {
                    canvas.animating = true;
                    a.animCamera = new FPSCamera(c.pixWidth, c.pixHeight, c.fovx, c.fovy, c.near, c.far);
                    // Remember which camera was used before so it can be restored
                    a.cameraBefore = this.camera;
                    this.camera = a.animCamera;
                    a.gif = new GIF({workers: 2, quality: 10, 
                                    workerScript:"../jslibs/gif.worker.js",
                                    width:c.pixWidth, height:c.pixHeight});
                    a.gif.on('finished', function(blob) {
                        window.open(URL.createObjectURL(blob));
                    });
                    // Remember the show camera settings, but turn off
                    // the camera displays for the animation
                    a.showCameras = canvas.showCameras;
                    canvas.showCameras = false;
                    requestAnimationFrame(canvas.repaint.bind(canvas));
                }
            }
        }
        this.animationMenu.add(canvas, 'MakeGIF');
    }


    /**
     * Setup menus to control positions and colors of lights
     * 
     * @param {object} scene The scene object
     * @param {int} pixWidth Width of the canvas in pixels
     * @param {int} pixHeight Height of the canvas in pixels
     */
    setupLightMenus(scene, pixWidth, pixHeight) {
        let canvas = this;
        // Add a camera object to each light so that the user can
        // move the lights around

        // Remove any menus that may have been there before
        this.lightMenus.forEach(function(menu) {
            canvas.lightMenu.removeFolder(menu);
        });
        this.lightMenus = [];
        scene.lights.forEach(function(light, i) {
            light.camera = new FPSCamera(pixWidth, pixHeight);
            if (!('pos' in light)) {
                light.pos = [0, 0, 0];
            }
            if (!('color' in light)) {
                light.color = [1, 1, 1];
            }
            if (!('atten' in light)) {
                light.atten = [1, 0, 0];
            }
            if ('towards' in light) {
                let towards = glMatrix.vec3.fromValues.apply(null, light.towards);
                glMatrix.vec3.cross(light.camera.up, light.camera.right, towards);
            }
            else {
                // Light points down by default
                light.towards = [0, -1, 0];
            }
            if (!('angle' in light)) {
                light.angle = Math.PI;
            }
            glMatrix.vec3.copy(light.camera.pos, light.pos);
            light.pos = light.camera.pos;
            // Also add each light to a GUI control
            let menu = canvas.lightMenu.addFolder("light " + i);
            canvas.lightMenus.push(menu);
            light.camera.position = vecToStr(light.pos);
            menu.add(light.camera, 'position').listen().onChange(
                function(value) {
                    let xyz = splitVecStr(value);
                    for (let k = 0; k < 3; k++) {
                        light.camera.pos[k] = xyz[k];
                    }
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            light.color_rgb = [255*light.color[0], 255*light.color[1], 255*light.color[2]];
            menu.addColor(light, 'color_rgb').onChange(
                function(v) {
                    light.color = glMatrix.vec3.fromValues(v[0]/255, v[1]/255, v[2]/255);
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            light.atten_c = light.atten[0];
            light.atten_l = light.atten[1];
            light.atten_q = light.atten[2];
            menu.add(light, 'atten_c', 0, 5).step(0.02).onChange(
                function(v) {
                    light.atten[0] = v;
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(light, 'atten_l', 0, 5).step(0.02).onChange(
                function(v) {
                    light.atten[1] = v;
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(light, 'atten_q', 0, 5).step(0.02).onChange(
                function(v) {
                    light.atten[2] = v;
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(light, 'angle', 0, Math.PI).step(0.01).onChange(
                function() {
                    requestAnimationFrame(canvas.repaint.bind(canvas));
                }
            );
            // Setup mechanism to move light around with camera
            light.viewFrom = false;
            menu.add(light, 'viewFrom').listen().onChange(
                function(v) {
                    if (v) {
                        // Toggle other lights viewFrom
                        scene.lights.forEach(function(other) {
                            if (!(other === light)) {
                                other.viewFrom = false;
                            }
                        });
                        // Turn off all cameras viewFrom
                        scene.cameras.forEach(function(camera) {
                            camera.viewFrom = false;
                        })
                        canvas.camera = light.camera;
                        requestAnimFrame(canvas.repaint.bind(canvas));
                    }
                }
            )
        });
    }

    /**
     * Setup menus to control positions and orientations of cameras
     * 
     * @param {object} scene The scene object
     * @param {int} pixWidth Width of the canvas in pixels
     * @param {int} pixHeight Height of the canvas in pixels
     */
    setupCameraMenus(scene, pixWidth, pixHeight) {
        let canvas = this;
        this.cameraMenus.forEach(function(menu) {
            canvas.cameraMenu.removeFolder(menu);
        });
        this.cameraMenus = [];
        scene.cameras.forEach(function(c, i) {
            c.camera = new FPSCamera(pixWidth, pixHeight);
            canvas.fillInCamera(c.camera, c);
            // Also add each camera to a GUI control
            let menu = canvas.cameraMenu.addFolder("camera " + i);
            canvas.cameraMenus.push(menu);

            // Setup mechanism to move camera around with keyboard/mouse
            if (i == 0) {
                c.viewFrom = true;
            }
            else {
                c.viewFrom = false;
            }
            menu.add(c, 'viewFrom').listen().onChange(
                function(v) {
                    if (v) {
                        // Toggle other cameras viewFrom
                        scene.cameras.forEach(function(other) {
                            if (!(other === c)) {
                                other.viewFrom = false;
                            }
                        });
                        // Turn off all viewFrom in lights
                        scene.lights.forEach(function(light) {
                            light.viewFrom = false;
                        });
                        canvas.camera = c.camera;
                        requestAnimFrame(canvas.repaint.bind(canvas));
                    }
                }
            );
            c.addToAnimation = function() {
                if (canvas.animation.cameraSequence.length > 0) {
                    canvas.animation.cameraSequence += ", ";
                }
                canvas.animation.cameraSequence += "" + i;
            }
            menu.add(c, 'addToAnimation');

            c.camera.position = vecToStr(c.camera.pos);
            menu.add(c.camera, 'position').listen().onChange(
                function(value) {
                    let xyz = splitVecStr(value);
                    for (let k = 0; k < 3; k++) {
                        c.camera.pos[k] = xyz[k];
                    }
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(c.camera, 'rotation').listen().onChange(
                function(value) {
                    let xyzw = splitVecStr(value);
                    for (let k = 0; k < 4; k++) {
                        c.camera.rot[k] = xyzw[k];
                    }
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(c.camera, 'fovx', 0.5, 3).onChange(
                function() {
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(c.camera, 'fovy', 0.5, 3).onChange(
                function() {
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(c.camera, 'near', 0.001, 100000).onChange(
                function() {
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
            menu.add(c.camera, 'far', 0.001, 100000).onChange(
                function() {
                    requestAnimFrame(canvas.repaint.bind(canvas));
                }
            );
        });
        if (scene.cameras.length > 0) {
            // Add the first camera to the drawing parameters
            scene.cameras[0].viewFrom = true;
            canvas.camera = scene.cameras[0].camera;
        }
    }

    
    /////////////////////////////////////////////////////
    //                  SCENE OBJECTS                  //
    /////////////////////////////////////////////////////

    /**
     * Add a point light to the scene at a particular (x, y, z) position
     * and with a particular (r, g, b) color
     * @param x X position of light
     * @param y Y position of light
     * @param z Z position of light
     * @param r Red component of light in [0, 255]
     * @param g Green component of light in [0, 255]
     * @param b Blue component of light in [0, 255]
     */
    addPointLight(x, y, z, r, g, b) {
        const color = new THREE.Color("rgb("+r+","+g+","+b+")");
        let light = new THREE.PointLight(color);
        light.position.x = x;
        light.position.y = y;
        light.position.z = z;
        this.scene.add(light);
        // Add a beacon so it's clear where the light is
        const geometry = new THREE.SphereGeometry(BEACON_SIZE, RADIAL_SEGMENTS, RADIAL_SEGMENTS);
        const material = new MeshStandardMaterial({"emissive":color});
        const sphere = new THREE.Mesh(geometry, material);
        setObjectPosRot(sphere, x, y, z, 0, 0, 0);
        this.scene.add(sphere);
    }

    /**
     * Create and cache a new material object, or return the pre-cached
     * material object if there's already a match for these parameters
     * 
     * @param r Red component of light in [0, 255]
     * @param g Green component of light in [0, 255]
     * @param b Blue component of light in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     * @returns 
     */
    addMaterial(r, g, b, roughness, metalness) {
        const prefix = getMaterialPrefix(r, g, b, roughness, metalness);
        if (!(prefix in this.materials)) {
            let params = {};
            params.color = new THREE.Color("rgb("+r+","+g+","+b+")");
            params.roughness = roughness;
            params.metalness = metalness;
            this.materials[prefix] = new THREE.MeshStandardMaterial(params);
        }
        return this.materials[prefix];
    }

    /**
     * Add a particular camera to the scene
     * @param x X position of camera
     * @param y Y position of camera
     * @param z Z position of camera
     * @param rot Rotation in degrees about y-axis
     */
    addCamera(x, y, z, ry) {
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        setObjectPosRot(camera, x, y, z, 0, ry, 0);
        this.cameras.push(camera);
        // TODO: Update menu
    }

    /**
     * Add a box to the scene
     * @param cx X center of box
     * @param cy Y center of box
     * @param cz Z center of box
     * @param xlen Length of box along x-axis
     * @param ylen Length of box along y-axis
     * @param zlen Length of box along z-axis
     * @param r Red component in [0, 255]
     * @param g Green component in [0, 255]
     * @param b Blue component in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     * @param rx Rotation about x-axis, in degrees
     * @param ry Rotation about y-axis, in degrees
     * @param rz Rotation about z-axis, in degrees
     */
    addBox(cx, cy, cz, xlen, ylen, zlen, r, g, b, roughness, metalness, rx, ry, rz) {
        if (rx === undefined) {
            rx = 0;
        }
        if (ry === undefined) {
            ry = 0;
        }
        if (rz === undefined) {
            rz = 0;
        }
        const geometry = new THREE.BoxGeometry(xlen, ylen, zlen);
        const material = this.addMaterial(r, g, b, roughness, metalness);
        const box = new THREE.Mesh(geometry, material);
        setObjectPosRot(box, cx, cy, cz, rx, ry, rz);
        this.scene.add(box);
        return box;
    }

    /**
     * Add a cylinder to the scene
     * @param cx X center of cylinder
     * @param cy Y center of cylinder
     * @param cz Z center of cylinder
     * @param radius Radius of the cylinder
     * @param height Height of the cylinder
     * @param r Red component in [0, 255]
     * @param g Green component in [0, 255]
     * @param b Blue component in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     * @param rx Rotation about x-axis, in degrees
     * @param ry Rotation about y-axis, in degrees
     * @param rz Rotation about z-axis, in degrees
     * @param sx Scale about x-axis
     * @param sy Scale about y-axis
     * @param sz Scale about z-axis
         */    
    addCylinder(cx, cy, cz, radius, height, r, g, b, roughness, metalness, rx, ry, rz, sx, sy, sz) {
        if (rx === undefined) {
            rx = 0;
        }
        if (ry === undefined) {
            ry = 0;
        }
        if (rz === undefined) {
            rz = 0;
        }
        if (sx === undefined) {
            sx = 1;
        }
        if (sy === undefined) {
            sy = 1;
        }
        if (sz === undefined) {
            sz = 1;
        }
        const radialSegments = 32;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, RADIAL_SEGMENTS);
        const material = this.addMaterial(r, g, b, roughness, metalness);
        const cylinder = new THREE.Mesh(geometry, material);
        setObjectPosRot(cylinder, cx, cy, cz, rx, ry, rz);
        setObjectScale(cylinder, sx, sy, sz);
        this.scene.add(cylinder);
    }

    /**
     * Add a cone to the scene
     * @param cx X center of cone
     * @param cy Y center of cone
     * @param cz Z center of cone
     * @param radius Radius of the cone
     * @param height Height of the cone
     * @param r Red component in [0, 255]
     * @param g Green component in [0, 255]
     * @param b Blue component in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     * @param rx Rotation about x-axis, in degrees
     * @param ry Rotation about y-axis, in degrees
     * @param rz Rotation about z-axis, in degrees
     * @param sx Scale about x-axis
     * @param sy Scale about y-axis
     * @param sz Scale about z-axis
     */
    addCone(cx, cy, cz, radius, height, r, g, b, roughness, metalness, rx, ry, rz, sx, sy, sz) {
        if (rx === undefined) {
            rx = 0;
        }
        if (ry === undefined) {
            ry = 0;
        }
        if (rz === undefined) {
            rz = 0;
        }
        if (sx === undefined) {
            sx = 1;
        }
        if (sy === undefined) {
            sy = 1;
        }
        if (sz === undefined) {
            sz = 1;
        }
        const geometry = new THREE.ConeGeometry(radius, height, RADIAL_SEGMENTS);
        const material = this.addMaterial(r, g, b, roughness, metalness);
        const cone = new THREE.Mesh(geometry, material);
        setObjectPosRot(cone, cx, cy, cz, rx, ry, rz);
        setObjectScale(cone, sx, sy, sz);
        this.scene.add(cone);
    }

    /**
     * Add an ellipsoid to the scene
     * @param cx X center of ellipsoid
     * @param cy Y center of ellipsoid
     * @param cz Z center of ellipsoid
     * @param radx Semi-axis x radius
     * @param rady Semi-axis y radius
     * @param radz Semi-axis z radius
     * @param r Red component in [0, 255]
     * @param g Green component in [0, 255]
     * @param b Blue component in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     * @param rx Rotation about x-axis, in degrees
     * @param ry Rotation about y-axis, in degrees
     * @param rz Rotation about z-axis, in degrees
     */
    addEllipsoid(cx, cy, cz, radx, rady, radz, r, g, b, roughness, metalness, rx, ry, rz) {
        if (rx === undefined) {
            rx = 0;
        }
        if (ry === undefined) {
            ry = 0;
        }
        if (rz === undefined) {
            rz = 0;
        }
        const geometry = new THREE.SphereGeometry(1, RADIAL_SEGMENTS, RADIAL_SEGMENTS);
        const material = this.addMaterial(r, g, b, roughness, metalness);
        const sphere = new THREE.Mesh(geometry, material);
        setObjectPosRot(sphere, cx, cy, cz, rx, ry, rz);
        setObjectScale(sphere, radx, rady, radz);
        this.scene.add(sphere);
        this.obj = sphere;
        return sphere;
    }

    /**
     * Asynchronously load the mesh geometry and the material for the mesh
     * and add them to the scene
     * 
     * @param path File path to mesh, relative to this directory
     * @param matpath File path to material, relative to this directory
     * @param cx Offset in x
     * @param cy Offset in y
     * @param cz Offset in z
     * @param rx Rotation around x-axis
     * @param ry Rotation around y-axis
     * @param rz Rotation around z-axis
     * @param sx Scale along x-axis
     * @param sy Scale along y-axis
     * @param sz Scale along z-axis
     */
    addTexturedMesh(path, matpath, cx, cy, cz, rx, ry, rz, sx, sy, sz) {
        const manager = new THREE.LoadingManager();
        const that = this;
        const mtlLoader = new MTLLoader(manager);
        const objLoader = new OBJLoader(manager);
        mtlLoader.load(matpath, (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load(path, function(obj) {       
                setObjectPosRot(obj, cx, cy, cz, rx, ry, rz);
                setObjectScale(obj, sx, sy, sz);
                that.scene.add(obj);
            },
            function(xhr){
                console.log(path + " " + (xhr.loaded / xhr.total * 100) + "% loaded")
            },
            function(){
                console.error("Error loading " + path);
            });
        },
        function(xhr){
            console.log(matpath + " " + (xhr.loaded / xhr.total * 100) + "% loaded")
        },
        function(){
            console.error("Error loading " + matpath);
        });
    }

    /**
     * Add a mesh to the scene
     * 
     * @param path File path to special mesh, relative to this directory
     * @param cx Offset in x
     * @param cy Offset in y
     * @param cz Offset in z
     * @param rx Rotation around x-axis
     * @param ry Rotation around y-axis
     * @param rz Rotation around z-axis
     * @param sx Scale along x-axis
     * @param sy Scale along y-axis
     * @param sz Scale along z-axis
     * @param r Red component in [0, 255]
     * @param g Green component in [0, 255]
     * @param b Blue component in [0, 255]
     * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
     * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
     */
    addMesh(path, cx, cy, cz, rx, ry, rz, sx, sy, sz, r, g, b, roughness, metalness) {
        const that = this;
        const objLoader = new OBJLoader();
        objLoader.load(path, function(obj) {       
            setObjectPosRot(obj, cx, cy, cz, rx, ry, rz);
            setObjectScale(obj, sx, sy, sz);
            const material = that.addMaterial(r, g, b, roughness, metalness);
            obj.traverse( function (child) {
                child.material = material;
            });
            that.scene.add(obj);
            that.obj = obj;
        },
        function(xhr){
            console.log(path + " " + (xhr.loaded / xhr.total * 100) + "% loaded")
        },
        function(){
            console.error("Error loading " + path);
        });
    }

    repaint() {
        /*if (!(this.obj === undefined)) {
            this.obj.rotation.y += 0.01;
        }*/

        // Redraw if walking
        let thisTime = (new Date()).getTime();
        let dt = (thisTime - this.lastTime)/1000.0;
        this.lastTime = thisTime;
        if (!this.animating) {
            if (this.movelr != 0 || this.moveud != 0 || this.movefb != 0) {
                this.camera.translate(0, 0, this.movefb, this.walkspeed*dt);
                this.camera.translate(0, this.moveud, 0, this.walkspeed*dt);
                this.camera.translate(this.movelr, 0, 0, this.walkspeed*dt);
                this.camera.position = vecToStr(this.camera.pos);
            }
        }
        this.renderer.render(this.scene, this.camera.camera);
        requestAnimationFrame(this.repaint.bind(this));
    }
}