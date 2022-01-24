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
    scene.addCylinder(cx, 1, cz, 0.05, 2, 127, 127, 127); 
    if (isEastWest) {
        // Draw a 0.5 x 0.5 box in the X/Y plane, with a thin dimension in Z
        scene.addBox(cx, 2, cz, 0.5, 0.5, 0.1, r, g, b);
    }
    else {
        // Draw a 0.5 x 0.5 box in the Y/Z plane, with a thin dimension in X
        scene.addBox(cx, 2, cz, 0.1, 0.5, 0.5, r, g, b);
    }
}    

/**
 * Draw a city block repeated several times
 */
void drawScene() {
    Scene3D scene;
    scene.addCamera(0, 2, 0, 0);
    scene.addCamera(0, 2, -20, 180);
    scene.addLight(0, 100, 0, 1, 1, 1);
    scene.addLight(0, -100, 0, 1, 1, 1);
    scene.addLight(-100, 100, 0, 1, 1, 1);
    scene.addLight(100, -100, 0, 1, 1, 1);
    
    // Add a large gray box for the ground
    scene.addBox(0, -25, 0, 1000, 50, 1000, 127, 127, 127);
    drawSign(scene, -2, -5, true, 255, 0, 0); // Red (255, 0, 0) sign at location (-2, -5)
    drawSign(scene, 0, -10, false, 0, 255, 0); // Green (0, 255, 0) sign at location (0, -10)
    scene.addSpecialMesh("homer", 0, 1, -7, 0, 1, 0, 1, 1, 1, 255, 255, 0); // Homer simpson

    scene.saveScene("simplescene.json", "Simple Sample Scene");
}

int main() {
    drawScene();
}
