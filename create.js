import { Color3, Color4, CreateBox, StandardMaterial } from "@babylonjs/core";
import Mesh from "mda/mda/Core/Mesh";
import Tessellator from "./Tessellator";
import { removeVerticalEdge } from "./removeEdge";

export const addMesh = (scene) => {
  let brep = new Mesh();

  const positions = [
    [5, 0, 5],
    [10, 0, 5],
    [9, 0, 10],
    [4, 0, 10],
    [5, 5, 5],
    [10, 5, 5],
    [9, 5, 10],
    [4, 5, 10],
  ];

  const cells = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ];

  /*var newPositions = [];
  var newCells = [];
  var vert1, vert2;
  for (var i=0; i<positions.length;i++)
  {
    for(var j=i+1;j< positions.length; j++)
    {
        if(positions[i][0] ==positions[j][0] && positions[i][2]==positions[j][2])
        {
          vert1=i;
          vert2=j;
        }

    }
  }
  for( var i=0; i<positions.length; i++)
  {
    newPositions.push(positions[i]);
  }
  for (var i=0;i<cells.length;i++)
  {
    var cell = [];
    for( var j=0; j<cells[i].length; j++)
    {
      if(cells[i][j]!==vert1 && cells[i][j]!==vert2)
        cell.push(cells[i][j]);
    }
    if(cell.length>2)
    newCells.push(cell);
  }
  brep.setPositions(newPositions);
  brep.setCells(newCells);*/

  brep.setPositions(positions);
  brep.setCells(cells);
  brep.process();
  removeVerticalEdge(brep, 0, 4); // Insert the vertex indices of the edge to be deleted.
  

  const tessellator = new Tessellator();
  
  const mesh = new CreateBox("box", {
    size: 10,
    updatable: true,
  }, scene);

  const { geometry, faceFacetMapping } = tessellator.tessellate(brep, scene);
  if (!geometry) return;

  const material = new StandardMaterial("material", scene);
  material.diffuseColor = new Color3(0.8, 0.8, 0.8);
  material.backFaceCulling = false;

  geometry.applyToMesh(mesh);
  mesh.enableEdgesRendering();
  mesh.edgesColor = new Color4(0, 0, 0, 1);

  mesh.material = material;
  
};