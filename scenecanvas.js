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
    // Update position
    obj.position.x = x;
    obj.position.y = y;
    obj.position.z = z;

    // Update rotation
    let q = glMatrix.quat.create();
    glMatrix.quat.fromEuler(q, rx, ry, rz);
    q = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
    let e = new THREE.Euler();
    e.setFromQuaternion(q);
    obj.rotation.x = e.x;
    obj.rotation.y = e.y;
    obj.rotation.z = e.z;
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
        let W = Math.round(window.innerWidth*winFac);
        let H = Math.round(window.innerHeight*winFac);
        this.W = W;
        this.H = H;
        renderer.setSize(W, H);

        const scene = new THREE.Scene();
        this.scene = scene;

        document.body.appendChild(renderer.domElement);
        this.glcanvas = renderer.domElement;
        this.renderer = renderer;
        this.initializeCallbacks();
        this.camera = null;
        this.lights = [];
        this.cameras = [];
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

        // Lighting menu
        this.lightMenu = gui.addFolder('Lights');
        this.lightMenus = []; // Individual menus for each light
        this.showLights = true;
        this.lightMenu.add(canvas, 'showLights').onChange(function(v) {
            for (let i = 0; i < canvas.lights.length; i++) {
                canvas.lights[i].beacon.visible = v;
            }
        });

        // Camera control menu
        this.cameraMenu = gui.addFolder('Cameras');
        this.cameraMenus = []; // Individual menus for each camera
        let cameraMenu = this.cameraMenu;
        this.showCameras = true;
        cameraMenu.add(canvas, 'showCameras').onChange(function(v) {
            for (let i = 0; i < canvas.cameras.length; i++) {
                canvas.cameras[i].axes.visible = v;
            }
        });
        this.invertYAxis = false;
        cameraMenu.add(canvas, 'invertYAxis');

        // Animation menu
        this.setupAnimationMenu();

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
        this.animation = {framesPerStep:50, framesPerSec: 30, cameraSequence:''};
        this.animationMenu.add(this.animation, "cameraSequence").listen();
        this.animationMenu.add(this.animation, 'framesPerStep');
        this.animationMenu.add(this.animation, 'framesPerSec');
        this.animating = false;
        this.MakeGIF = function() {
            let a = canvas.animation;
            a.frame = 0;
            let c = canvas.camera;
            a.sequence = a.cameraSequence.split(",");

            if (a.sequence.length < 2) {
                alert("Animation Error: Must have at least two cameras in the camera sequence!");
            }
            else {
                let valid = true;
                for (let i = 0; i < a.sequence.length; i++) {
                    a.sequence[i] = parseInt(a.sequence[i]);
                    if (a.sequence[i] >= canvas.cameras.length) {
                        alert("Animation Error: Camera " + a.sequence[i] + " does not exist!");
                        valid = false;
                    }
                }
                if (valid) {
                    canvas.animating = true;
                    a.animCamera = new FPSCamera(c.pixWidth, c.pixHeight, c.pos, c.fov, c.near, c.far);
                    // Remember which camera was used before so it can be restored
                    a.cameraBefore = canvas.camera;
                    canvas.camera = a.animCamera;
                    a.gif = new GIF({workers: 2, quality: 10, 
                                    workerScript:"jsmodules/gif.worker.js",
                                    width:c.pixWidth, height:c.pixHeight});
                    a.gif.on('finished', function(blob) {
                        window.open(URL.createObjectURL(blob));
                    });
                    // Remember the show camera settings, but turn off
                    // the camera displays for the animation
                    a.showCameras = canvas.showCameras;
                    canvas.showCameras = false;
                }
            }
        }
        this.animationMenu.add(canvas, 'MakeGIF');
    }


    /**
     * Add a light to the menu
     * @param {three.js Light} light Light to add
     * @param x X position of light
     * @param y Y position of light
     * @param z Z position of light
     * @param r Red component of light in [0, 255]
     * @param g Green component of light in [0, 255]
     * @param b Blue component of light in [0, 255]
     */
    addLightToMenu(light, x, y, z, r, g, b) {
        let canvas = this;
        this.lights.push(light);
        let i = this.lights.length;
        // Add a camera object to each light so that the user can
        // move the lights around
        light.camera = new FPSCamera(this.W, this.H, [x, y, z]);
        light.camera.addTracker(light);
        light.camera.addTracker(light.beacon);
        light.color_rgb = [r, g, b];
        // Also add each light to a GUI control
        let menu = canvas.lightMenu.addFolder("light " + i);
        this.lightMenus.push(menu);
        let res = menu.add(light.camera, 'position').listen().onChange(
            function(value) {
                light.camera.pos = splitVecStr(value);
                light.camera.updatePos();
            }
        );
        light.posMenu = res;

        function updateColor(v) {
            light.color.r = v[0]/255;
            light.color.g = v[1]/255;
            light.color.b = v[2]/255;
            light.beacon.material.color.r = light.intensity*v[0]/255;
            light.beacon.material.color.g = light.intensity*v[1]/255;
            light.beacon.material.color.b = light.intensity*v[2]/255;
        }
        menu.addColor(light, 'color_rgb').onChange(
            function(v) {
                updateColor(v);
            }
        );
        menu.add(light, 'intensity', 0, 1).step(0.02);
        // Setup mechanism to move light around with camera
        light.viewFrom = false;
        menu.add(light, 'viewFrom').listen().onChange(
            function(v) {
                if (v) {
                    // Toggle other lights viewFrom
                    canvas.lights.forEach(function(other) {
                        if (!(other === light)) {
                            other.viewFrom = false;
                        }
                    });
                    // Turn off all cameras viewFrom
                    canvas.cameras.forEach(function(camera) {
                        camera.viewFrom = false;
                    })
                    canvas.camera = light.camera;
                }
            }
        );
    }

    /**
     * Setup menus to control positions and orientations of cameras
     * 
     */
    addCameraToMenu(c, x, y, z) {
        const canvas = this;
        c.idx = this.cameras.length;
        this.cameras.push(c);
        c.pos = [x, y, z];
        c.updatePos();
        let i = this.cameras.length;

        // Also add each camera to a GUI control
        let menu = canvas.cameraMenu.addFolder("camera " + i);
        canvas.cameraMenus.push(menu);

        // Setup mechanism to move camera around with keyboard/mouse
        if (i == 1) {
            c.viewFrom = true;
            this.camera = c;
        }
        else {
            c.viewFrom = false;
        }
        menu.add(c, 'viewFrom').listen().onChange(
            function(v) {
                if (v) {
                    // Toggle other cameras viewFrom
                    canvas.cameras.forEach(function(other) {
                        if (!(other === c)) {
                            other.viewFrom = false;
                        }
                    });
                    // Turn off all viewFrom in lights
                    canvas.lights.forEach(function(light) {
                        light.viewFrom = false;
                    });
                    canvas.camera = c;
                }
            }
        );
        c.addToAnimation = function() {
            if (canvas.animation.cameraSequence.length > 0) {
                canvas.animation.cameraSequence += ", ";
            }
            canvas.animation.cameraSequence += "" + c.idx;
        }
        menu.add(c, 'addToAnimation');
        menu.add(c, 'position').listen().onChange(
            function(value) {
                c.pos = splitVecStr(value);
                c.updatePos();
            }
        );
        menu.add(c, 'rotation').listen().onChange(
            function(value) {
                let xyzw = splitVecStr(value);
                for (let k = 0; k < 4; k++) {
                    c.rot[k] = xyzw[k];
                }
                c.updateRot();
            }
        );
        menu.add(c.camera, 'near', 0.001, 100000).onChange(
            function() {
                c.camera.updateProjectionMatrix();
            }
        );
        menu.add(c.camera, 'far', 0.001, 100000).onChange(
            function() {
                c.camera.updateProjectionMatrix();
            }
        );
        menu.add(c.camera, 'fov', 1, 179).onChange(
            function() {
                c.camera.updateProjectionMatrix();
            }
        );
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
     * @param intensity The intensity of the light, in [0, 1]
     */
    addPointLight(x, y, z, r, g, b, intensity) {
        const color = new THREE.Color("rgb("+r+","+g+","+b+")");
        let light = new THREE.PointLight(color, intensity);
        light.position.x = x;
        light.position.y = y;
        light.position.z = z;
        this.scene.add(light);
        // Add a beacon so it's clear where the light is
        const geometry = new THREE.SphereGeometry(BEACON_SIZE, RADIAL_SEGMENTS, RADIAL_SEGMENTS);
        const material = new MeshBasicMaterial({"color":color});
        const sphere = new THREE.Mesh(geometry, material);
        setObjectPosRot(sphere, x, y, z, 0, 0, 0);
        this.scene.add(sphere);
        light.beacon = sphere;
        this.addLightToMenu(light, x, y, z, r, g, b);
    }

    /**
     * Add a point light to the scene at a particular (x, y, z) position
     * pointing towards the origin, and with a particular (r, g, b) color
     * @param x X position of light
     * @param y Y position of light
     * @param z Z position of light
     * @param r Red component of light in [0, 255]
     * @param g Green component of light in [0, 255]
     * @param b Blue component of light in [0, 255]
     * @param intensity The intensity of the light
     */
    addDirectionalLight(x, y, z, r, g, b, intensity) {
        const color = new THREE.Color("rgb("+r+","+g+","+b+")");
        let light = new THREE.DirectionalLight(color, intensity);
        light.position.x = x;
        light.position.y = y;
        light.position.z = z;
        this.scene.add(light);
        // Add a beacon so it's clear where the light is
        const geometry = new THREE.RingGeometry(BEACON_SIZE/2, BEACON_SIZE, RADIAL_SEGMENTS, RADIAL_SEGMENTS);
        const material = new MeshBasicMaterial({"color":color});
        const ring = new THREE.Mesh(geometry, material);
        setObjectPosRot(ring, x, y, z, 0, 0, 0);
        this.scene.add(ring);
        light.beacon = ring;
        this.addLightToMenu(light, x, y, z, r, g, b);
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
        const camera = new FPSCamera(this.W, this.H);
        // Add axes so it's clear where the camera is
        const axes = new THREE.AxesHelper();
        this.scene.add(axes);
        camera.axes = axes;
        camera.addTracker(axes);
        // Update position and rotation
        camera.pos = [x, y, z];
        camera.updatePos();
        let q = glMatrix.quat.create();
        glMatrix.quat.fromEuler(q, 0, ry, 0);
        camera.setRotFromQuat(q);
        camera.updateRot();
        this.addCameraToMenu(camera, x, y, z);
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
     * @param shininess A number in [0, 255] describing how shiny the mesh is
     */
    addTexturedMesh(path, matpath, cx, cy, cz, rx, ry, rz, sx, sy, sz, shininess) {
        const manager = new THREE.LoadingManager();
        const that = this;
        const mtlLoader = new MTLLoader(manager);
        const objLoader = new OBJLoader(manager);
        mtlLoader.load(matpath, (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            console.log(mtl.materials.Default_OBJ);
            mtl.materials.Default_OBJ.shininess = shininess;
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
        // Redraw if walking
        let thisTime = (new Date()).getTime();
        let dt = (thisTime - this.lastTime)/1000.0;
        this.lastTime = thisTime;

        if (this.camera === null) {
            this.addCamera(0, 0, 0, 0);
        }

        // Move the camera to the appropriate position/orientation if animating
        if (this.animating) {
            let a = this.animation;
            // Frame in this leg of the animation
            let frame = a.frame % a.framesPerStep; 
            // Leg of the animation
            let idx = (a.frame - frame)/a.framesPerStep;
            if (idx > a.sequence.length - 2) {
                // Reached end of animation; save gif
                this.animating = false;
                a.gif.render();
                // Restore camera settings
                this.showCameras = a.showCameras;
                this.camera = a.cameraBefore;
            }
            else {
                let t = frame/a.framesPerStep;
                let idx1 = a.sequence[idx];
                let idx2 = a.sequence[idx+1];
                let camera1 = this.cameras[idx1];
                let camera2 = this.cameras[idx2];
                // Linearly interpolate between two cameras to get position
                let pos = glMatrix.vec3.create();
                glMatrix.vec3.lerp(pos, camera1.pos, camera2.pos, t);
                this.camera.pos = pos;
                this.camera.updatePos();
                // Slerp interpolate the rotations
                let rot = glMatrix.quat.create();
                glMatrix.quat.slerp(rot, camera1.getQuatFromRot(), camera2.getQuatFromRot(), t);
                this.camera.setRotFromQuat(rot);
                this.camera.updateRot();
            }
        }
        else {
            if (this.movelr != 0 || this.moveud != 0 || this.movefb != 0) {
                this.camera.translate(0, 0, this.movefb, this.walkspeed*dt);
                this.camera.translate(0, this.moveud, 0, this.walkspeed*dt);
                this.camera.translate(this.movelr, 0, 0, this.walkspeed*dt);
                this.camera.position = vecToStr(this.camera.pos);
            }
        }

        this.renderer.render(this.scene, this.camera.camera);

        if (this.animating) {
            let a = this.animation;
            a.frame += 1;
            let delay = Math.round(1000/a.framesPerSec);
            a.gif.addFrame(canvas.glcanvas, {copy:true, delay:delay});
            requestAnimationFrame(canvas.repaint.bind(canvas));
        }
        
        requestAnimationFrame(this.repaint.bind(this));
    }
}