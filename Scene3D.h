/**
 * This code creates flat hierarchy scene for three.js
 * @author ctralie
 */
#ifndef SCENE3D_H
#define SCENE3D_H

#include <vector>
#include <map>
#include <fstream>
#include <string>
#include <sstream>
#include <iostream>
#include <math.h>
#define PI 3.14159265

using namespace std;

#define HTML_PREFIX "<!DOCTYPE html>\n<html>\n    <head>\n        <meta charset=\"utf-8\"/>\n    </head>\n    <body>\n        <!-- three.js scripts -->\n        <!-- startup three.js -->\n        <script src=\"jsmodules/three.min.js\"></script>\n        <script src=\"jsmodules/three.module.js\"></script>\n        <script src=\"jsmodules/gif.js\"></script>\n        <!-- load models and look at them-->\n        <script src=\"jsmodules/OBJLoader.js\"></script>\n        <script src=\"jsmodules/MTLLoader.js\"></script>\n        <!-- postprocessing -->\n        <script src=\"jsmodules/CopyShader.js\"></script>\n        <script src=\"jsmodules/Pass.js\"></script>\n        <script src=\"jsmodules/ShaderPass.js\"></script>\n        <script src=\"jsmodules/MaskPass.js\"></script>\n        <script src=\"jsmodules/EffectComposer.js\"></script>\n        <script src=\"jsmodules/RenderPass.js\"></script>\n        <script src=\"jsmodules/DigitalGlitch.js\"></script>\n        <script src=\"jsmodules/GlitchPass.js\"></script>\n\n        <!--Other outside libraries -->\n        <script type=\"text/javascript\" src=\"jsmodules/jquery-3.5.1.min.js\"></script>\n        <script type=\"text/javascript\" src=\"jsmodules/dat.gui.min.js\"></script>\n        <script type=\"text/javascript\" src=\"jsmodules/gl-matrix-min.js\"></script>\n\n        <!-- Our code -->\n        <script type=\"text/javascript\" src=\"cameras3d.js\"></script>\n        <script type=\"text/javascript\" src=\"scenecanvas.js\"></script>\n\n\n";

#define HTML_END "<table cellpadding>\n    <tr>\n        <td>\n            <h3>Controls</h3>\n            <ul>\n                <li><b>Mouse</b>: Click and drag to look around</li>\n                <li><b>W:</b> Forward</li>\n                <li><b>S:</b> Backwards</li>\n                <li><b>A:</b> Left</li>\n                <li><b>D:</b> Right</li>\n                <li><b>E:</b> Up</li>\n                <li><b>C:</b> Down</li>\n            </ul>\n        </td>\n    </tr>\n</table>\n    </body>\n</html>";

class Scene3D {
    private:
        stringstream sceneCode;

    public:
        Scene3D() {
            sceneCode << "let canvas = new SceneCanvas();\n";
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
        void addBox(double cx, double cy, double cz, double xlen, 
                        double ylen, double zlen, 
                        double r, double g, double b,
                        double roughness, double metalness,
                        double rx, double ry, double rz) {
            sceneCode << "canvas.addBox(" << cx << "," << cy << "," << cz << "," << xlen << "," << ylen << "," << zlen << "," << r << "," << g << "," << b << "," << roughness << "," << metalness << "," << rx << "," << ry << "," << rz << ");\n";
        }
        
        /**
         * Add an axis-aligned box to the scene
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
         */
        void addBox(double cx, double cy, double cz,
                            double xlen, double ylen, double zlen,
                            double r, double g, double b,
                            double roughness, double metalness) {
            addBox(cx, cy, cz, xlen, ylen, zlen, r, g, b, roughness, metalness, 0, 0, 0);
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
        void addCylinder(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double roughness, double metalness,
                                double rx, double ry, double rz,
                                double sx, double sy, double sz) {
            sceneCode << "canvas.addCylinder(" << cx << "," << cy << "," << cz << "," << radius << "," << height << "," << r << "," << g << "," << b << "," << roughness << "," << metalness << "," << rx << "," << ry << "," << rz << "," << sx << "," << sy << "," << sz << ");\n";
        }
        
        /**
         * Add an axis-aligned cylinder to the scene
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
         */
        void addCylinder(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double roughness, double metalness) {
            addCylinder(cx, cy, cz, radius, height, r, g, b, roughness, metalness, 0, 0, 0, 1, 1, 1);
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
        void addCone(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double roughness, double metalness,
                                double rx, double ry, double rz,
                                double sx, double sy, double sz) {
            sceneCode << "canvas.addCone(" << cx << "," << cy << "," << cz << "," << radius << "," << height << "," << r << "," << g << "," << b << "," << roughness << "," << metalness << "," << rx << "," << ry << "," << rz << "," << sx << "," << sy << "," << sz << ");";
        }
        
        /**
         * Add an axis-aligned cone to the scene
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
         */
        void addCone(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double roughness, double metalness) {
            addCone(cx, cy, cz, radius, height, r, g, b, roughness, metalness, 0, 0, 0, 1, 1, 1);
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
        void addEllipsoid(double cx, double cy, double cz, 
                                double radx, double rady, double radz,
                                double r, double g, double b, 
                                double roughness, double metalness,
                                double rx, double ry, double rz) {
            sceneCode << "canvas.addEllipsoid(" << cx << "," << cy << "," << cz << "," << radx << "," << rady << "," << radz << "," << r << "," << g << "," << b << "," << roughness << "," << metalness << "," << rx << "," << ry << "," << rz << ");\n";
        }
        
        /**
         * Add an axis-aligned ellipsoid to the scene
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
         */
        void addEllipsoid(double cx, double cy, double cz, 
                                double radx, double rady, double radz,
                                double r, double g, double b,
                                double roughness, double metalness) {
            addEllipsoid(cx, cy, cz, radx, rady, radz, r, g, b, roughness, metalness, 0, 0, 0);
        }
        
        /**
         * Add a sphere to the scene
         * @param cx X center of the sphere
         * @param cy Y center of the sphere
         * @param cz Z center of the sphere
         * @param radius Radius of the sphere
         * @param r Red component in [0, 255]
         * @param g Green component in [0, 255]
         * @param b Blue component in [0, 255]
         * @param roughness How rough the material appears. 0.0 means a smooth mirror reflection, 1.0 means fully diffuse. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.roughness
         * @param metalness How much the material is like a metal. Non-metallic materials such as wood or stone use 0.0, metallic use 1.0, with nothing (usually) in between. https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.metalness
         */
        void addSphere(double cx, double cy, double cz, double radius,
                            double r, double g, double b,
                            double roughness, double metalness) {
            addEllipsoid(cx, cy, cz, radius, radius, radius, r, g, b, roughness, metalness);
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
        void addMesh(string path, 
                        double cx, double cy, double cz, 
                        double rx, double ry, double rz,
                        double sx, double sy, double sz,
                        double r, double g, double b,
                        double roughness, double metalness) {
            sceneCode << "canvas.addMesh(\"" << path << "\"," << cx << "," << cy << "," << cz << "," << rx << "," << ry << "," << rz << "," << sx << "," << sy << "," << sz << "," << r << "," << g << "," << b << "," << roughness << "," << metalness << ");\n";
        }

        /**
        * Add a textured mesh to the scene
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
        void addTexturedMesh(string path, string matpath,
                        double cx, double cy, double cz, 
                        double rx, double ry, double rz,
                        double sx, double sy, double sz,
                        double shininess) {
            sceneCode << "canvas.addTexturedMesh(\"" << path << "\",\"" << matpath << "\"," << cx << "," << cy << "," << cz << "," << rx << "," << ry << "," << rz << "," << sx << "," << sy << "," << sz << "," << shininess << ");\n";
        }
        
        
        /**
         * Add a particular camera to the scene
         * @param x X position of camera
         * @param y Y position of camera
         * @param z Z position of camera
         * @param rot Rotation in degrees about y-axis
         */
        void addCamera(double x, double y, double z, double rot) {
            sceneCode << "canvas.addCamera(" << x << "," << y << "," << z << "," << rot << ");\n";
        }
        
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
        void addPointLight(double x, double y, double z, double r, double g, double b, double intensity) {
            sceneCode << "canvas.addPointLight(" << x << "," << y << "," << z << "," << r << "," << g << "," << b << "," << intensity << ");\n";
        }

        /**
         * Add a directional light to the scene at a particular (x, y, z) position, pointing
         * with parallel rays towards the origin (0, 0, 0)
         * and with a particular (r, g, b) color
         * @param x X position of light
         * @param y Y position of light
         * @param z Z position of light
         * @param r Red component of light in [0, 255]
         * @param g Green component of light in [0, 255]
         * @param b Blue component of light in [0, 255]
         * @param intensity The intensity of the light, in [0, 1]
         */
        void addDirectionalLight(double x, double y, double z, double r, double g, double b, double intensity) {
            sceneCode << "canvas.addDirectionalLight(" << x << "," << y << "," << z << "," << r << "," << g << "," << b << "," << intensity << ");\n";
        }

        /**
         * Save this scene to a file
         * @param filename Path to which to save file (should end with .json)
         * @param sceneName Title of the scene to display in the viewer
         */
        void saveScene(string filename, string sceneName) {
            std::ofstream out(filename.c_str());
            out << HTML_PREFIX;
            out << "<script>\n";
            out << sceneCode.str();
            out << "canvas.name = \"" << sceneName << "\";\n";
            out << "canvas.repaint();\n</script>";
            out << HTML_END;
            out.close();
        }
};

#endif