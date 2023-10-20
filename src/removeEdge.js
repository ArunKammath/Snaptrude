import Mesh from "mda/mda/Core/Mesh";
import Tessellator from "./Tessellator";
import FaceVertices from "mda/mda/Queries/FaceVertices";
import HalfEdge from "mda/mda/Core/HalfEdge";
import Edge from "mda/mda/Core/Edge";
import Face from "mda/mda/Core/Face";

function RemoveFromFace(brep,face,vertIdx, newFaceVerticesIdx)
{
    // check whether the vertex is part of the face.
    const faceVertices =  FaceVertices(face);
    const vertexIndices= faceVertices.map((vertex) => vertex.getIndex());
    var vertFound = false;
    for( var idx = 0; idx<vertexIndices.length;idx++)
    {
        if(vertexIndices[idx]==vertIdx)
            vertFound = true;
    }
    if(vertFound==false)
        return;
        
    // find the half edge that contains the vert1Idx.
    var startHalfEdge = face.getHalfEdge();
    while(startHalfEdge.vertex.getIndex() != vertIdx)
    {
        startHalfEdge =startHalfEdge.getNextHalfEdge();
    }
    //Find the half edge that points to the vert1Idx
    var prevHalfEdge = startHalfEdge.getNextHalfEdge();
    while(prevHalfEdge.getNextHalfEdge()!=startHalfEdge)
    {
        prevHalfEdge = prevHalfEdge.getNextHalfEdge();
    }
    // prevVertex == vertex before the vert1Idx in the loop.
    // nextVertex == vertex after the vert1Idx in the loop.
    var prevVertex = prevHalfEdge.getVertex();
    var nextVertex = startHalfEdge.getNextHalfEdge().getVertex();

    newFaceVerticesIdx.push(prevVertex.getIndex());
    newFaceVerticesIdx.push(nextVertex.getIndex());
    
    
    var key0 = prevVertex.getIndex() + '-' + nextVertex.getIndex();
    var key1 = nextVertex.getIndex() + '-' + prevVertex.getIndex();
    var edgesMap = brep.getEdgeMap();
    //If a half edge is already presnt between prev and next vertex,
    // then delete the half edge of vert1Idx and return.
    var startEdge;
    var prevEdge;
    if(edgesMap[key0] !=undefined && edgesMap[key1]!=undefined)
    {
        var lastHalfEdge = startHalfEdge;
        while(lastHalfEdge.getNextHalfEdge()!=prevHalfEdge)
        {
            lastHalfEdge=lastHalfEdge.getNextHalfEdge();
        }
        startHalfEdge.setNextHalfEdge(undefined);
        startHalfEdge.setFace(undefined);
        startEdge = startHalfEdge.getEdge();
        startEdge.setHalfEdge(undefined);
        prevHalfEdge.setNextHalfEdge(undefined);
        prevHalfEdge.setFace(undefined);
        prevEdge = prevHalfEdge.getEdge();
        prevEdge.setHalfEdge(undefined);
        lastHalfEdge.setNextHalfEdge(lastHalfEdge);
        lastHalfEdge.setFace(undefined);
        face.setHalfEdge(lastHalfEdge);
        return;
    }
    
    var edge = new Edge();
    var edges=brep.getEdges();
    edge.setIndex(edges.length);
    edges.push(edge);
    if(edgesMap[key0]===undefined)
        edgesMap[key0] = edge;
    if(edgesMap[key1]===undefined)
        edgesMap[key1] = edge; 
    
    // If half edge is not present between prev and next vertex , Create a halfedge
    var halfEdge = new HalfEdge();
    halfEdge.setVertex(prevVertex);
    halfEdge.setEdge(edge);
    halfEdge.setFace(face);
    halfEdge.setNextHalfEdge(startHalfEdge.getNextHalfEdge());
    
    edge.setHalfEdge(halfEdge);
    var halfEdges = brep.getHalfEdges();
    halfEdges.push(halfEdge);

    // reset the half edge attached to the face
    face.setHalfEdge(halfEdge);   
    var nextHalfEdge = halfEdge;
    while(nextHalfEdge.getNextHalfEdge()!=prevHalfEdge)
    {
        nextHalfEdge = nextHalfEdge.getNextHalfEdge();
    }
    //complete the new loop
    nextHalfEdge.setNextHalfEdge(halfEdge);
    // detach vert1Idx from the loop.
    prevEdge = prevHalfEdge.getEdge();
    prevEdge.setHalfEdge(undefined);
    prevHalfEdge.setNextHalfEdge(undefined);
    prevHalfEdge.setFace(undefined);
    startEdge = startHalfEdge.getEdge();
    startEdge.setHalfEdge(undefined);
    startHalfEdge.setNextHalfEdge(undefined);
    startHalfEdge.setFace(undefined);    

};
function CreateFace(brep, newFaceVerticesIdx)
{
    var faces = brep.getFaces();
    var orderedVerticesIdx = new Set();         // vertices int set for a loop in the order
    var processedVertex = new Set();            // vertices that has been process to form the loop.

    var j=0;
    var k=j+1;
    var count=0;
    while(count<=4)         //Create the loop.
    {
        if(brep.containsEdge(newFaceVerticesIdx[j],newFaceVerticesIdx[k]) && !processedVertex.has(k))
        {
            orderedVerticesIdx.add(j);
            processedVertex.add(j);
            j=k;
            count++;
            if(count==3)
            {
                orderedVerticesIdx.add(k);
                break;
            }
        }
        k++;
        if(k==4)
            k=0;
    }

    var edgeMap = brep.getEdgeMap();
    var vertices = brep.getVertices();
    var halfEdges = brep.getHalfEdges();
    var faceVertices = Array.from(orderedVerticesIdx);
    var firstVertexIdx  = newFaceVerticesIdx[faceVertices[0]];
    var secondVertexIdx = newFaceVerticesIdx[faceVertices[1]];
    var dirEdge = edgeMap[ firstVertexIdx + '-' +secondVertexIdx];
    var dirHalfEdge = dirEdge.getHalfEdge();
    var vertIdx = dirHalfEdge.getVertex().getIndex();
    if(vertIdx == firstVertexIdx) // new face vertices loop should be opposite direction of existing half edge.
    {
        faceVertices.reverse();
    }
    //Creating New Face
    var face = new Face();
    face.setIndex(faces.length);
    faces.push(face);
    

    var prevHalfEdge = undefined;
    var firstHalfEdge = undefined;    
    var flen = faceVertices.length;
    for( var i = 0; i < flen; i++ ) {
        var vertexIndexCurr = newFaceVerticesIdx[faceVertices[ i ]];
        var vertexIndexNext = newFaceVerticesIdx[faceVertices[ ( i + 1 ) % flen ]];

        var edge = edgeMap[ vertexIndexCurr + '-' + vertexIndexNext ];
        var vertexIdx =  vertexIndexCurr ;
        var vertex = vertices[vertexIdx];
        
        //Set Half Edge Properties
        var halfedge = new HalfEdge();
        halfedge.setVertex( vertex );
        halfedge.setFace( face );
        halfedge.setEdge( edge );
        halfEdges.push(halfedge);
        var flipHalfEdge = edge.getHalfEdge();
        halfedge.setFlipHalfEdge(flipHalfEdge); 
        if(flipHalfEdge.getFlipHalfEdge() == undefined)
        {
            flipHalfEdge.setFlipHalfEdge(halfedge);
        }

        if( prevHalfEdge !== undefined ) {
            prevHalfEdge.setNextHalfEdge( halfedge );
          }
          prevHalfEdge = halfedge;
  
          if( i === 0 ) {
            firstHalfEdge = halfedge;
          }
    }
    face.setHalfEdge( firstHalfEdge );
    prevHalfEdge.setNextHalfEdge( firstHalfEdge );
};
export function removeVerticalEdge(brep, vert1Idx,vert2Idx)
{
    
    var newFaceVerticesIdx = [];   // unique list of vertices from which vert1Idx and vert2Idx are detached.

    // Remove vert1Idx and vert2Idx from each face.
    brep.getFaces().forEach((face) => RemoveFromFace(brep,face, vert1Idx, newFaceVerticesIdx));
    brep.getFaces().forEach((face) => RemoveFromFace(brep,face, vert2Idx, newFaceVerticesIdx));
    newFaceVerticesIdx = Array.from(new Set(newFaceVerticesIdx));
    for(var i=0;i<newFaceVerticesIdx.length;i++)
    {
        if(newFaceVerticesIdx[i]==vert1Idx)
            newFaceVerticesIdx.splice(i,1);
        else if(newFaceVerticesIdx[i]==vert2Idx)
            newFaceVerticesIdx.splice(i,1);
    }
    CreateFace(brep, newFaceVerticesIdx);

    // Remove unwanted halfEdges.
    var halfEdges = brep.getHalfEdges();
    var newHalfEdges = [];
    for( var i=0;i<halfEdges.length;i++)
    {
        if(halfEdges[i].getFace()==undefined)
            delete halfEdges[i];
        else
            newHalfEdges.push(halfEdges[i]);
    }
    brep.halfEdges = newHalfEdges;

    //Remove unwanted edges
    var edges = brep.getEdges();
    var newEdges = [];
    for( var i=0;i<edges.length;i++)
    {
        if(edges[i].getHalfEdge()==undefined)
            delete edges[i];
        else
        {
            edges[i].setIndex(newEdges.length);
            newEdges.push(edges[i]);
        }
    }
    brep.edges = newEdges;

    //Remove unwanted faces
    var faces = brep.getFaces();
    var newFaces = [];
    {
        for(var i=0;i<faces.length;i++)
        {
            var faceVertices = FaceVertices(faces[i]);
            if(faceVertices.length<3)
                delete faces[i];
            else
            {
                faces[i].setIndex(newFaces.length);
                newFaces.push(faces[i]);
            } 
        }
    }
    brep.faces = newFaces;
};

