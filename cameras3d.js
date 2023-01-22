/*
Files that have been assumed to have been also loaded
primitives3d.js
*/

function splitVecStr(s) {
    ret = [];
    s.split(",").forEach(function(x) {
        ret.push(parseFloat(x));
    });
    return ret;
}

function vecToStr(v, k) {
    if (k === undefined) {
        k = 2;
    }
    s = "";
    for (let i = 0; i < v.length; i++) {
        s += v[i].toFixed(k);
        if (i < v.length-1) {
            s += ",";
        }
    }
    return s;
}

/**
 * Superclass for 3D cameras
 */
class Camera3D {    
    /**
    * @param {int} pixWidth Width of viewing window
    * @param {int} pixHeight Height of viewing window
    * @param {float} fov Field of view in y direction
    * @param {float} near Distance to near viewing plane
    * @param {float} far Distance to far viewing plane
    */
    constructor(pixWidth, pixHeight, fov, near, far) {
        this.type = "default";
        this.pixWidth = pixWidth;
        this.pixHeight = pixHeight;
        if (fov === undefined) {
            fov = Camera3D.DEFAULT_FOV;
        }
        this.fov = fov;
        if (near === undefined) {
            near = Camera3D.DEFAULT_NEAR;
        }
        this.near = near;
        if (far === undefined) {
            far = Camera3D.DEFAULT_FAR;
        }
        this.far = far;
        this.camera = new THREE.PerspectiveCamera(fov*180/Math.PI, pixWidth/pixHeight, near, far);
        this.threeTrackers = [this.camera]; //Three.js objects that track the position
    }

    /**
     * A three.js object whose position tracks the position of this camera
     * @param {three.js object} obj Three.js object
     */
    addTracker(obj) {
        this.threeTrackers.push(obj);
    }

    /**
     * Return the perspective matrix
     */
    getPMatrix() {
        let pMatrix = glMatrix.mat4.create();
        let fovx2 = this.fovx * 90/Math.PI;
        let fovy2 = this.fovy * 90/Math.PI;
        let fov = {upDegrees:fovy2, downDegrees:fovy2, 
                   leftDegrees:fovx2, rightDegrees:fovx2};
        glMatrix.mat4.perspectiveFromFieldOfView(pMatrix, fov, this.near, this.far);
        return pMatrix;
    }

    /**
     * Return the ModelView matrix
     */
    getMVMatrix() {
        //To keep right handed, make z vector -towards
        let T = glMatrix.vec3.create();
        glMatrix.vec3.cross(T, this.right, this.up);
        let rotMat = glMatrix.mat4.create();
        for (let i = 0; i < 3; i++) {
            rotMat[i*4] = this.right[i];
            rotMat[i*4+1] = this.up[i];
            rotMat[i*4+2] = T[i];
        }
        //glMatrix.mat4.transpose(rotMat, rotMat);
        let transMat = glMatrix.mat4.create();
        glMatrix.vec3.scale(this.pos, this.pos, -1.0);
        glMatrix.mat4.translate(transMat, transMat, this.pos);
        let mvMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(mvMatrix, rotMat, transMat);
        glMatrix.vec3.scale(this.pos, this.pos, -1.0); //Have to move pos back
        return mvMatrix;
    }

    /**
     * Figure out the right and up vectors from the given quaternion
     * 
     * @param {glMatrix.quat} q The quaternion
     */
    setRotFromQuat(q) {
        let m = glMatrix.mat3.create();
        glMatrix.mat3.fromQuat(m, q);
        this.right = glMatrix.vec3.fromValues(m[0], m[3], m[6]);
        this.up = glMatrix.vec3.fromValues(m[1], m[4], m[7]);
    }

    /**
     * Use the right/up vectors to construct a corresponding
     * 3x3 rotation matrix
     * 
     * @returns {glMatrix.mat3} The rotation matrix
     */
    getRotMat3() {
        let T = glMatrix.vec3.create();
        glMatrix.vec3.cross(T, this.right, this.up);
        let rotMat = glMatrix.mat3.create();
        for (let i = 0; i < 3; i++) {
            rotMat[i*3] = this.right[i];
            rotMat[i*3+1] = this.up[i];
            rotMat[i*3+2] = T[i];
        }
        glMatrix.mat3.transpose(rotMat, rotMat);
        return rotMat;
    }
    /** 
     * Compute the quaternion from the given right/up vectors
     * 
     * @returns {glMatrix.quat} The quaternion
     */
    getQuatFromRot() {
        let rotMat = this.getRotMat3();
        let q = glMatrix.quat.create();
        glMatrix.quat.fromMat3(q, rotMat);
        return q;
    }

    /**
     * Send the position information over to the three.js camera object
     */
    updatePos() {
        this.position = vecToStr(this.pos);
        for (let i = 0; i < this.threeTrackers.length; i++) {
            this.threeTrackers[i].position.x = this.pos[0];
            this.threeTrackers[i].position.y = this.pos[1];
            this.threeTrackers[i].position.z = this.pos[2];
        }
    }

    /**
     * Send the rotation information over to the three.js camera object
     */
    updateRot() {
        let q = this.getQuatFromRot();
        q = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
        let e = new THREE.Euler();
        e.setFromQuaternion(q);
        this.camera.rotation.x = e.x;
        this.camera.rotation.y = e.y;
        this.camera.rotation.z = e.z;
    }
        
}
// Default values, assuming 4:3 aspect ratio
Camera3D.DEFAULT_FOV = 1.4;
Camera3D.DEFAULT_NEAR = 0.01;
Camera3D.DEFAULT_FAR = 1000;


//For use with WASD + mouse bindings
class FPSCamera extends Camera3D {
    /**
    * @param {int} pixWidth Width of viewing window
    * @param {int} pixHeight Height of viewing window
    * @param {vec3} pos Initial position of camera
    * @param {float} fov Field of view in y direction
    * @param {float} near Distance to near viewing plane
    * @param {float} far Distance to far viewing plane
     */
    constructor(pixWidth, pixHeight, pos, fov, near, far) {
        super(pixWidth, pixHeight, fov, near, far);
        this.type = "fps";
        this.right = glMatrix.vec3.fromValues(1, 0, 0);
        this.up = glMatrix.vec3.fromValues(0, 1, 0);
        if (pos === undefined) {
            this.pos = glMatrix.vec3.fromValues(0, 0, 0);
        }
        else {
            this.pos = pos;
        }
        this.updatePos();
        this.rotation = vecToStr(this.getQuatFromRot());
    }
    
    /**
     * Translate the camera in 3D
     * @param {float} dx Change in x
     * @param {float} dy Change in y
     * @param {float} dz Change in z
     * @param {float} speed Factor by which to translate
     */
    translate(dx, dy, dz, speed) {
        let T = glMatrix.vec3.create();
        glMatrix.vec3.cross(T, this.up, this.right);//Cross in opposite order so moving forward
        glMatrix.vec3.scaleAndAdd(this.pos, this.pos, this.right, dx*speed);
        glMatrix.vec3.scaleAndAdd(this.pos, this.pos, this.up, dy*speed);
        glMatrix.vec3.scaleAndAdd(this.pos, this.pos, T, dz*speed);
        this.updatePos();
    }

    /**
     * Rotate the up direction around the right direction
     * @param {float} ud Up down motion, in pixels 
     */
    rotateUpDown = function(ud) {
        let thetaud = 2.0*this.fov*ud/this.pixHeight;
        this.rotateUpDownTheta(thetaud);
    }

    /**
     * Rotate the up direction around the right direction, by a particular angle
     * @param {float} thetaud Up down motion, in radians
     */
    rotateUpDownTheta(thetaud) {
        let q = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(q, this.right, thetaud);
        glMatrix.vec3.transformQuat(this.up, this.up, q);
        this.rotation = vecToStr(this.getQuatFromRot());
        this.updateRot();
    }
    

    /**
     * Rotate the right direction around the up direction
     * but project onto the XY plane
     * @param {float} lr Left/right motion of the mouse, in pixels
     */
    rotateLeftRight(lr) {
        let thetalr = 2.0*this.fov*lr/this.pixHeight;
        this.rotateLeftRightTheta(thetalr);
    }

    /**
     * Rotate the right direction around the up direction, by a particular angle,
     * but project onto the XY plane
     * @param {float} thetalr Left/right motion of the mouse, in radians
     */
    rotateLeftRightTheta (thetalr) {
        let q = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(q, this.up, thetalr);
        glMatrix.vec3.transformQuat(this.right, this.right, q);
        //Snap to the XY plane to keep things from getting wonky
        this.right[1] = 0;
        glMatrix.vec3.normalize(this.right, this.right);
        //Make sure the up vector is still orthogonal
        let dot = glMatrix.vec3.dot(this.right, this.up);
        glMatrix.vec3.scaleAndAdd(this.up, this.up, this.right, -dot);
        glMatrix.vec3.normalize(this.up, this.up);
        this.rotation = vecToStr(this.getQuatFromRot());
        this.updateRot();
    }
}