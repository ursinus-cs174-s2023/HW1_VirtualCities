/**
 * This code creates JSON flat hierarchy scene files for the ggslac library
 * https://github.com/ctralie/ggslac
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

class Scene3D {
    private:
        vector<double*> cameras; // xyzr
        vector<double*> lights; // xyz, rgb
        map<string, int> colors; // Index "r_g_b" -> ID
        vector<string> shapesJSON; // JSON strings of shapes
    
       /**
         * Return the material ID of a lambertian material with a particular
         * RGB color sequence
         * @param r Red component in [0, 255]
         * @param g Green component in [0, 255]
         * @param b Blue component [0, 255]
         * @return A string corresponding to the material
         */
        string getColorString(double r, double g, double b) {
            stringstream sstr;
            sstr << r/255 << "," << g/255 << "," << b/255;
            string hash = sstr.str();
            if (colors.find(hash) == colors.end()) {
                colors[hash] = colors.size();
            }
            stringstream ret;
            ret << "color" << colors[hash];
            return ret.str();
        }

        /**
         * Create a string with the JSON for the materials, based on the
         * colors that were chosen
         * @return String with JSON
         */
        string getMaterialsJSON() {
            stringstream json;
            json << "\"materials\":{\n";
            size_t i = 0;
            for (const pair<string, int>& c : colors) {
                json << "\t\"color" << c.second << "\": {";
                json << "\"kd\":[" << c.first << "]}";
                if (i+1 < colors.size()) {
                    json << ",";
                }
                json << "\n";
                i++;
            }
            json << "}";
            return json.str();
        }
        
        /**
         * Create a string with the JSON for the lights in the scene, based
         * on the lights that the user added
         * @return String with JSON
         */
        string getLightsJSON() {
            stringstream json;
            json << "\"lights\":[\n";
            for (size_t i = 0; i < lights.size(); i++) {
                double* L = lights.at(i);
                json << "{\n";
                json << "\t\"pos\":[" << L[0] << ", " << L[1] << ", " << L[2] << "],\n";
                json << "\t\"color\":[" << L[3] << ", " << L[4] << ", " << L[5] << "]\n";
                json << "}";
                if (i < lights.size() - 1) {
                    json << ",";
                }
                json << "\n";
            }
            json << "]";
            return json.str();
        }
        
        /**
         * Create a string with the JSON for the cameras in the scene, based
         * on the cameras that the user added
         * @return String with JSON
         */
        string getCamerasJSON() {
            stringstream json;
            json << "\"cameras\":[\n";
            for (size_t i = 0; i < cameras.size(); i++) {
                double* c = cameras.at(i);
                json << "{\n";
                json << "\t\"pos\":[" << c[0] << ", " << c[1] << ", " << c[2] << "],\n";
                // Compute quaternion for y rotation
                double sh = sin(c[3]*PI/360);
                double ch = cos(c[3]*PI/360);
                json << "\t\"rot\": [0, " << sh << ", 0, " << ch << "]\n";
                json << "}";
                if (i+1 < cameras.size()) {
                    json << ",";
                }
                json << "\n";
            }
            json << "]";
            return json.str();
        }
        
        /**
         * Return a JSON string with the flat hierarchy of shapes
         * in the scene
         * @return JSON string
         */
        string getShapesJSON() {
            stringstream json;
            json << "\"children\":[\n";
            for (size_t i = 0; i < shapesJSON.size(); i++) {
                json << shapesJSON.at(i);
                if (i+1 < shapesJSON.size()) {
                    json << ",";
                }
                json << "\n";
            }
            json << "]\n";
            return json.str();
        }

        /**
         * Return a string that puts everything together 
         */
        string getFullSceneString(string sceneName) {
            stringstream json;
            json << "{\n\"name\":\"" << sceneName << "\",\n";
            json << getMaterialsJSON() << ",\n";
            json << getLightsJSON() << ",\n";
            json << getCamerasJSON() << ",\n";
            json << getShapesJSON() << "\n}";
            return json.str();
        }



    public:
        Scene3D() {}
        ~Scene3D() {
            for (size_t i = 0; i < cameras.size(); i++) {
                delete[] cameras.at(i);
            }
            for (size_t i = 0; i < lights.size(); i++) {
                delete[] lights.at(i);
            }
        }
        
        /**
         * Return a hierarchy of JSON for doing a translation, then a sequence
         * of 3 rotations
         * @param tx Translation in x
         * @param ty Translation in y
         * @param tz Translation in z
         * @param rx Rotation about x
         * @param ry Rotation about y
         * @param rz Rotation about z
         * @param shape string with JSON for the shape
         */
        string getTransformationHierarchy(double tx, double ty, double tz, 
                                                double rx, double ry, double rz, 
                                                double sx, double sy, double sz, string shape) {
            stringstream json;
            json << "{\n";
            // Translation
            json << "\"transform\":[1, 0, 0, " << tx << ", 0, 1, 0, " << ty << ", 0, 0, 1, " << tz << ", 0, 0, 0, 1],\n";
            json << "\"children\":[{";
            // Rotation about z
            double c = cos(rz*PI/180);
            double s = sin(rz*PI/180);
            json << "\"transform\":[" << c << ", " << -s << ", 0, 0, " << s << ", " << c << ", 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],\n";
            json << "\"children\":[{\n";
            // Rotation about y
            c = cos(ry*PI/180);
            s = sin(ry*PI/180);
            json << "\"transform\":[" << c << ", 0, " << s << ", 0, 0, 1, 0, 0, " << -s << ", 0, " << c << ", 0, 0, 0, 0, 1],\n";
            json << "\"children\":[{\n";
            // Rotation about x
            c = cos(rx*PI/180);
            s = sin(rx*PI/180);
            json << "\"transform\":[1, 0, 0, 0, 0, " << c << ", " << -s << ", 0, 0, " << s << ", " << c << ", 0, 0, 0, 0, 1],\n";
            json << "\"children\":[{\n";
            json << "\"transform\":[" << sx << ", 0, 0, 0, 0, " << sy << ", 0, 0, 0, 0, " << sz << ", 0, 0, 0, 0, 1],\n";
            json << "\"shapes\":[\n";
            json << shape;
            json << "]\n";
            json << "}]\n"; // End rotation about z
            json << "}]\n"; // End rotation about y
            json << "}]\n"; // End rotation about x
            json << "}]\n"; // End translation
            json << "}";
            return json.str();
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
         * @param rx Rotation about x-axis, in degrees
         * @param ry Rotation about y-axis, in degrees
         * @param rz Rotation about z-axis, in degrees
         */
        void addBox(double cx, double cy, double cz, double xlen, 
                        double ylen, double zlen, 
                        double r, double g, double b,
                        double rx, double ry, double rz) {
            stringstream boxJSON;
            boxJSON << "{\"type\":\"box\",\n";
            boxJSON << "\"material\":\"" << getColorString(r, g, b) << "\"}";
            shapesJSON.push_back(getTransformationHierarchy(cx, cy, cz, rx, ry, rz, xlen, ylen, zlen, boxJSON.str()));
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
         */
        void addBox(double cx, double cy, double cz,
                            double xlen, double ylen, double zlen,
                            double r, double g, double b) {
            addBox(cx, cy, cz, xlen, ylen, zlen, r, g, b, 0, 0, 0);
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
         * @param rx Rotation about x-axis, in degrees
         * @param ry Rotation about y-axis, in degrees
         * @param rz Rotation about z-axis, in degrees
         * @param sx Scale about x-axis
         * @param sy Scale about y-axis
         * @param sz Scale about z-axis
         */
        void addCylinder(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double rx, double ry, double rz,
                                double sx, double sy, double sz) {
            stringstream cylinderJSON;
            cylinderJSON << "{\"type\":\"cylinder\",\n";
            cylinderJSON << "\"radius\":" << radius << ",\n";
            cylinderJSON << "\"height\":" << height << ",\n";
            cylinderJSON << "\"material\":\"" << getColorString(r, g, b) << "\"}";
            shapesJSON.push_back(getTransformationHierarchy(cx, cy, cz, rx, ry, rz, sx, sy, sz, cylinderJSON.str()));
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
         */
        void addCylinder(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b) {
            addCylinder(cx, cy, cz, radius, height, r, g, b, 0, 0, 0, 1, 1, 1);
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
         * @param rx Rotation about x-axis, in degrees
         * @param ry Rotation about y-axis, in degrees
         * @param rz Rotation about z-axis, in degrees
         * @param sx Scale about x-axis
         * @param sy Scale about y-axis
         * @param sz Scale about z-axis
         */
        void addCone(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b,
                                double rx, double ry, double rz,
                                double sx, double sy, double sz) {
            stringstream coneJSON;
            coneJSON << "{\"type\":\"cone\",\n";
            coneJSON << "\"radius\":" << radius << ",\n";
            coneJSON << "\"height\":" << height << ",\n";
            coneJSON << "\"material\":\"" << getColorString(r, g, b) << "\"}";
            shapesJSON.push_back(getTransformationHierarchy(cx, cy, cz, rx, ry, rz, sx, sy, sz, coneJSON.str()));
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
         */
        void addCone(double cx, double cy, double cz, double radius, 
                                double height, double r, double g, double b) {
            addCone(cx, cy, cz, radius, height, r, g, b, 0, 0, 0, 1, 1, 1);
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
         * @param rx Rotation about x-axis, in degrees
         * @param ry Rotation about y-axis, in degrees
         * @param rz Rotation about z-axis, in degrees
         */
        void addEllipsoid(double cx, double cy, double cz, 
                                double radx, double rady, double radz,
                                double r, double g, double b, 
                                double rx, double ry, double rz) {
            stringstream ellipsoidJSON;
            ellipsoidJSON << "{\"type\":\"sphere\",\n";
            ellipsoidJSON << "\"material\":\"" << getColorString(r, g, b) << "\"}";
            shapesJSON.push_back(getTransformationHierarchy(cx, cy, cz, rx, ry, rz, radx, rady, radz, ellipsoidJSON.str()));
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
         */
        void addEllipsoid(double cx, double cy, double cz, 
                                double radx, double rady, double radz,
                                double r, double g, double b) {
            addEllipsoid(cx, cy, cz, radx, rady, radz, r, g, b, 0, 0, 0);
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
         */
        void addSphere(double cx, double cy, double cz, double radius,
                            double r, double g, double b) {
            addEllipsoid(cx, cy, cz, radius, radius, radius, r, g, b);
        }
        
        /**
         * Add a special mesh to the scene
         * 
         * @param meshName Name of the special mesh
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
         */
        void addSpecialMesh(string meshName, 
                                double cx, double cy, double cz, 
                                double rx, double ry, double rz,
                                double sx, double sy, double sz,
                                double r, double g, double b) {
            stringstream meshJSON;
            meshJSON << "{\"type\":\"mesh\",\n";
            meshJSON << "\"material\":\"" << getColorString(r, g, b) << "\",\n";
            meshJSON << "\"filename\":\"../meshes/" << meshName << ".off\"}";
            shapesJSON.push_back(getTransformationHierarchy(cx, cy, cz, rx, ry, rz, sx, sy, sz, meshJSON.str()));
        }
        
        
        /**
         * Add a particular camera to the scene
         * @param x X position of camera
         * @param y Y position of camera
         * @param z Z position of camera
         * @param rot Rotation in degrees about y-axis
         */
        void addCamera(double x, double y, double z, double rot) {
            double* xyzr = new double[4];
            xyzr[0] = x;
            xyzr[1] = y;
            xyzr[2] = z;
            xyzr[3] = rot;
            cameras.push_back(xyzr);
        }
        
        /**
         * Add a light to the scene at a particular (x, y, z) position
         * and with a particular (r, g, b) color
         * @param x X position of light
         * @param y Y position of light
         * @param z Z position of light
         * @param r Red component of light in [0, 255]
         * @param g Green component of light in [0, 255]
         * @param b Blue component of light in [0, 255]
         */
        void addLight(double x, double y, double z, double r, double g, double b) {
            double* light = new double[6];
            light[0] = x;
            light[1] = y;
            light[2] = z;
            light[3] = r;
            light[4] = g;
            light[5] = b;
            lights.push_back(light);
        }
        

        /**
         * Save this scene to a file
         * @param filename Path to which to save file (should end with .json)
         * @param sceneName Title of the scene to display in the viewer
         */
        void saveScene(string filename, string sceneName) {
            std::ofstream out(filename.c_str());
            string json = getFullSceneString(sceneName);
            out << json;
            out.close();
        }

        /**
         * Print JSON for the scene to standard out   
         * @param sceneName Title of the scene to display in the viewer
         */
        void printScene(string sceneName) {
            cout << getFullSceneString(sceneName);
        }
};

#endif