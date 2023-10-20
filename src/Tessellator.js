import { Geometry, VertexBuffer, VertexData } from "@babylonjs/core";
import earcut from "earcut";
import FaceVertices from "mda/mda/Queries/FaceVertices";

class Tessellator {

  verData = [];
  indices = [];
  uvData = [];
  faceFacetMapping = {};
  facetID = -1;
  nBabylonVertices = 0;

  tessellate(brep, scene) {

    const tessellationData = {
      geometry: null,
      faceFacetMapping: null
    };

    if (!brep) {
      console.log("No BRep present");
      return tessellationData;
    }

    this.flush();

    brep.getPositions().forEach((position, index) => {
      if (Object.prototype.toString.call(position).includes("Float32Array")) {
        brep.positions[index] = Array.prototype.slice.call(position);
      }
    });

    brep.getFaces().forEach((face,i) => this._tessellateFace.call(this, brep, face));
   
    const geometry = new Geometry("tessellatedGeometry", scene);

    geometry.setVerticesData(
      VertexBuffer.PositionKind,
      this.verData,
      true
    );

    geometry.setVerticesData(VertexBuffer.UVKind, this.uvData, true);
    geometry.setIndices(this.indices, null, true);

    let normals = [];
    VertexData.ComputeNormals(this.verData, this.indices, normals);

    geometry.setVerticesData(VertexBuffer.NormalKind, normals, true);

    tessellationData.geometry = geometry;
    tessellationData.faceFacetMapping = this.faceFacetMapping;

    return tessellationData;
  }


  _tessellateFace(brep, face) {

    
    const index = face.getIndex();
    this.faceFacetMapping[index] = [];

    const positions = brep.getPositions();
    const faceVertices = FaceVertices(face);
    const facePositions = faceVertices.map((vertex) => positions[vertex.getIndex()]);

    let flattenedPositions = [...facePositions];
    this._populatePositions(facePositions);
    this._populateIndices.call(
      this,
      flattenedPositions
    );

    this.nBabylonVertices = this.verData.length / 3;

  }

  _populatePositions(facePositions) {
    facePositions.forEach((position) => {
      this.verData.push(...position);
    });
  };

  _populateIndices(
    facePositions
  ) {
    let earcutPath = [];

    facePositions.forEach((vertex) => earcutPath.push(...vertex));

    var yCoord = earcutPath[1];
    var same=1;
    for( var i=1;i<earcutPath.length;i+=3)
    {
        if(yCoord != earcutPath[i])
          same=0;
    }
    if(same ==1)
    {
        for(var i=1;i<earcutPath.length; i+=3)
        {
            var temp = earcutPath[i];
            earcutPath[i] =earcutPath[i+1];
            earcutPath[i+1]=temp;
        }
    }

    let triangles = earcut (earcutPath, [], 3);

    for (let point of triangles){
      this.indices.push(point + this.nBabylonVertices);
    }
  };

  flush() {
    this.verData = [];
    this.indices = [];
    this.uvData = [];
    this.faceFacetMapping = {};
    this.facetID = -1;
    this.nBabylonVertices = 0;
  }

}

export default Tessellator;

