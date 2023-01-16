import numpy as np
import matplotlib.pyplot as plt



def load_off(filename):
    """
    Load in an OFF file, assuming it's a triangle mesh
    Parameters
    ----------
    filename: string
        Path to file
    Returns
    -------
    VPos : ndarray (N, 3)
        Array of points in 3D
    VColors : ndarray(N, 3)
        Array of RGB colors
    ITris : ndarray (M, 3)
        Array of triangles connecting points, pointing to vertex indices
    """
    fin = open(filename, 'r')
    nVertices = 0
    nFaces = 0
    lineCount = 0
    face = 0
    vertex = 0
    divideColor = False
    VPos = np.zeros((0, 3))
    VColors = np.zeros((0, 3))
    ITris = np.zeros((0, 3))
    for line in fin:
        lineCount = lineCount+1
        fields = line.split() #Splits whitespace by default
        if len(fields) == 0: #Blank line
            continue
        if fields[0][0] in ['#', '\0', ' '] or len(fields[0]) == 0:
            continue
        #Check section
        if nVertices == 0:
            if fields[0] == "OFF" or fields[0] == "COFF":
                if len(fields) > 2:
                    fields[1:4] = [int(field) for field in fields]
                    [nVertices, nFaces, nEdges] = fields[1:4]
                    #Pre-allocate vertex arrays
                    VPos = np.zeros((nVertices, 3))
                    VColors = np.zeros((nVertices, 3))
                    ITris = np.zeros((nFaces, 3))
                if fields[0] == "COFF":
                    divideColor = True
            else:
                fields[0:3] = [int(field) for field in fields]
                [nVertices, nFaces, nEdges] = fields[0:3]
                VPos = np.zeros((nVertices, 3))
                VColors = np.zeros((nVertices, 3))
                ITris = np.zeros((nFaces, 3))
        elif vertex < nVertices:
            fields = [float(i) for i in fields]
            P = [fields[0],fields[1], fields[2]]
            color = np.array([0.5, 0.5, 0.5]) #Gray by default
            if len(fields) >= 6:
                #There is color information
                if divideColor:
                    color = [float(c)/255.0 for c in fields[3:6]]
                else:
                    color = [float(c) for c in fields[3:6]]
            VPos[vertex, :] = P
            VColors[vertex, :] = color
            vertex = vertex+1
        elif face < nFaces:
            #Assume the vertices are specified in CCW order
            fields = [int(i) for i in fields]
            ITris[face, :] = fields[1:fields[0]+1]
            face = face+1
    fin.close()
    VPos = np.array(VPos, np.float64)
    VColors = np.array(VColors, np.float64)
    ITris = np.array(ITris, np.int32)
    return (VPos, VColors, ITris)

def save_off(filename, VPos, VColors, ITris):
    """
    Save a .off file
    Parameters
    ----------
    filename: string
        Path to which to write .off file
    VPos : ndarray (N, 3)
        Array of points in 3D
    VColors : ndarray(N, 3)
        Array of RGB colors
    ITris : ndarray (M, 3)
        Array of triangles connecting points, pointing to vertex indices
    """
    nV = VPos.shape[0]
    nF = ITris.shape[0]
    fout = open(filename, "w")
    if VColors.size == 0:
        fout.write("OFF\n%i %i %i\n"%(nV, nF, 0))
    else:
        fout.write("COFF\n%i %i %i\n"%(nV, nF, 0))
    for i in range(nV):
        fout.write("%g %g %g"%tuple(VPos[i, :]))
        if VColors.size > 0:
            fout.write(" %g %g %g"%tuple(VColors[i, :]))
        fout.write("\n")
    for i in range(nF):
        fout.write("3 %i %i %i\n"%tuple(ITris[i, :]))
    fout.close()
    

"""
meshes = ["bunny", "cow", "dinopet", "hand-simple", "homer", "octopus", "proftralie", "StyrofoamHead", "teapot"]

for mesh in meshes:
    filename = "{}.off".format(mesh)
    VPos, _, ITris = load_off(filename)
    VPos -= np.mean(VPos, 0)
    VPos = VPos*np.sqrt(VPos.shape[0]/np.sum(VPos**2))
    save_off(filename, VPos, np.array([]), ITris)
"""

# Princeton mesh benchmark
categories = ["Human", "Cup", "Glasses", "Airplane", "Ant", "Chair", "Octopus", "Table", "Teddy", "Hand", "Plier", "Fish", "Bird", "Spring", "Armadillo", "Bust", "Mech", "Bearing", "Vase", "Fourleg"]
for i, category in enumerate(categories):
    if category == "Spring":
        continue
    for k in range(20):
        idx = 1 + i*20+k
        filein = "benchmark/{}.off".format(idx)
        fileout = "benchmarknorm/{}{}.off".format(category, k+1)
        print(fileout)
        VPos, _, ITris = load_off(filein)
        VPos -= np.mean(VPos, 0)
        VPos = VPos*np.sqrt(VPos.shape[0]/np.sum(VPos**2))
        save_off(fileout, VPos, np.array([]), ITris)