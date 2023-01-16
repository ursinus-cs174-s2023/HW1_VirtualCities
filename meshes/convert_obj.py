import glob
import os
import open3d as o3d

for filein in glob.glob("*.off"):
    fileout = filein[0:-3] + "obj"
    if not os.path.exists(fileout):
        print(filein)
        mesh = o3d.io.read_triangle_mesh(filein)
        mesh.compute_vertex_normals()
        o3d.io.write_triangle_mesh(fileout, mesh, write_ascii=False, write_vertex_normals=True)
    else:
        print("Skipping", fileout)