#include <stdio.h>
#include <stdlib.h>
#include "Scene3D.h"

/**
 * A class that holds methods to draw different 3D objects and piece
 * together scenes
 */

/**
 * Draw a simple sign that consists of a 2 meter tall cylinder for the
 * poll and a 0.5x0.5x0.02 meter box for the sign itself
 * 
 * @param scene The scene to which to add the sign (passed by reference)
 * @param cx Center of the sign in x
 * @param cz Center of the sign in z
 * @param isEastWest If true, the sign is oriented from east to west.  Otherwise,
 *                   the sign is oriented from north to south
 * @param r Red component of the sign
 * @param g Green component of the sign
 * @param b Blue component of the sign
 */
void drawSign(Scene3D& scene, double cx, double cz, 
                            bool isEastWest, double r, double g, double b) {
    // Draw the main pole
    scene.addCylinder(cx, 1, cz, 0.05, 2, 127, 127, 127, 1, 0); 
    if (isEastWest) {
        // Draw a 0.5 x 0.5 box in the X/Y plane, with a thin dimension in Z
        scene.addBox(cx, 2, cz, 0.5, 0.5, 0.1, r, g, b, 1, 0);
    }
    else {
        // Draw a 0.5 x 0.5 box in the Y/Z plane, with a thin dimension in X
        scene.addBox(cx, 2, cz, 0.1, 0.5, 0.5, r, g, b, 1, 0);
    }
}    

/**
 * Draw a city block repeated several times
 */
void drawScene() {
    Scene3D scene;
    // LIGHTS
    scene.addPointLight(-100, 200, 0, 200, 200, 200, 1.0);
    scene.addPointLight(100, 200, 0, 200, 200, 200, 1.0);
    scene.addPointLight(0, 200, -100, 200, 200, 200, 1.0);
    scene.addPointLight(0, 200, 100, 200, 200, 200, 1.0);
    
    // CAMERA
    //scene.addCamera(0, 2, 0, 0);
    //scene.addCamera(0, 2, -20, 180);

    // ACTION
    // Add a large brown box for the ground
    scene.addBox(0, -25, 0, 1000, 50, 1000, 45, 25, 8, 1, 0);
    // Draw a red sign 5 units in front in z and two units to 
    // the left in x that's oriented from east to west
    drawSign(scene, -2, -5, true, 255, 0, 0); // Red (255, 0, 0)
    // Draw a green sign 10 units in front of z that's 
    // oriented from north to south
    drawSign(scene, 0, -10, false, 0, 255, 0); // Green (0, 255, 0)
    // Draw a shiny, stone-like, yellow Homer Simpson
    scene.addMesh("meshes/homer.obj", 1, 1.4, -7, 0, 0, 0, 1, 1, 1, 255, 255, 0, 1, 1); 
    scene.addTexturedMesh("meshes/smokestack/medres.obj", "meshes/smokestack/medres.mtl", 0, 18, -20, 0, 180, 0, 10, 10, 10);

    scene.saveScene("simplescene.html", "Simple Sample Scene");
}

int main() {
    drawScene();
}
