/**********

Smartcore : L'empileuse

author: serge.vi / smartfriendz
licence : GPL



TODO:
- clips glass


***********/

// global vars - updated from interface but need to be avalaible in all functions
var _globalResolution; // used to speed up rendering. ugly for preview . use 24 or 32 for generating stl.
var _globalWidth; // exernal dimension of the all printer
var _globalHeight; // exernal dimension of the all printer
var _globalDepth; // exernal dimension of the all printer
var _printableWidth;
var _printableDepth;
var _printableHeight;
var _wallThickness; // box wood thickness
var _XYrodsDiam; // usually 6 or 8 .. or 10? 
var _XYlmDiam; // lm6uu, lm8uu ... will be calculated from rods diam
var _ZrodsDiam; // usually 6, 8, 10 or 12 
var _ZscrewDiam = 8; 
var _ZlmDiam; // lm6uu, lm8uu ... will be calculated from rods diam
var _nemaXYZ;  // nema 14 , nema 17 
var _XrodsWidth=40; //space between rods on X axis
var _ZrodsWidth=120; //space between rods on Z axis
var _extrusionType = 0; // 0 bowden 1 direct
var XrodLength = 300; // will be calculated in main from parameters.
var YrodLength = 300; // will be calculated in main from parameters.
var ZrodLength = 300; // will be calculated in main from parameters.
var _rodsSupportThickness = 3; // thickness around rods for all supports
var outputPlateWidth = 180; //used when output to printable plates for elements
var outputPlateDepth = 180;
var mk7Diam = 10;
var beltXAddon = 120; // belt extra length over rod size - bearing guides and difference between bearing edge to end of rod
var beltYAddon = 30; // belt extra length over y rod size - distance from motor pulley edge to Y rod mount and
var _rodsVisibility = 0;
var _exportReady = 0; // 0 normal 1 flat
// global for work
var _bearingsDepth = 35; // hack.need to be cleaned. 
var headoffset = -50; // used to place the head along X axis
var XaxisOffset = 0; // used to palce the X axis on Y
var _ZaxisOffset = -30; // used to place Z stage.
var endxJheadAttachHolesWidth = 32; // tempo.. 

var nutRadius = 15/2; // M8 nut radius

var output; // show hide objects  from output choosen in the parameters.


// interactive parameters

function getParameterDefinitions() {
  return [
  { name: '_version', caption: 'Version', type: 'text', initial: "1.0.9 mar 13 2015" },
  { 
        name: '_output', 
        caption: 'What to show :', 
        type: 'choice', 
        values: [0,1,2,3,4,-1,5,6,7,8,9,10,11,12,13], 
        initial: 1, 
        captions: ["-----", //0
                    "All printer assembly", //1
                    "printed parts plate", //2
                    "parts only", //3
                    "Walls and rods sizes", //4
                    "-----", // nope
                    "motor xy", //5
                    "bearings xy", //6
                    "slide y", //7
                    "z top", //8
                    "z bottom", //9
                    "z slide", //10
                    "z assembly", // 11
                    "head", //12
                    "extruder" //13
                    ]
    },
    { name: '_globalResolution', caption: 'output resolution (16, 24, 32)', type: 'int', initial: 4 },   
  
    { name: '_printableWidth', caption: 'Print width:', type: 'int', initial: 185 },
    { name: '_printableHeight', caption: 'Print height :', type: 'int', initial: 210 },
    { name: '_printableDepth', caption: 'Print depth :', type: 'int', initial: 185 },
    { name: '_wallThickness', caption: 'Box wood thickness:', type: 'int', initial: 15 },
    { name: '_XYrodsDiam', caption: 'X Y Rods diameter (6, 8 or 10):', type: 'int', initial: 10},
    { name: '_ZrodsDiam', caption: 'Z Rods diameter (6,8,10,12):', type: 'int', initial: 10},
    { name: '_rodsVisibility', caption: 'Show rods:', type: 'choice', initial: 1, values:[0,1],captions: ["false", "true"]},
    { name: '_exportReady', caption: 'Export ready:', type: 'choice', initial: 0, values:[0,1],captions: ["false", "true"]},
    
    
    {name: '_nemaXYZ', 
      type: 'choice',
      caption: 'Stepper motors type',
      values: [35, 42],
      captions: ["nema14","nema17"], 
      initial: 42
    }
    /*
    {name: 'extrusionType', 
      type: 'choice',
      caption: 'Extrusion type',
      values: [0, 1],
      captions: ["direct","bowden"], 
      initial: 1
    }
    */
  ]; 
}



// -----------------  printed elements 



function zTopBase(width, depth, height) { 
    mesh = difference(
        //main
        cube({size:[width,depth,height]}),
        // outside form left
        cube({size:[13,depth,height]}).translate([0,-5,0]),
        // outside form right
        cube({size:[13,depth,height]}).translate([width-13,-5,0]),
        //screw left
        slottedHole(4,8,depth).rotateX(90).rotateY(90).translate([4,depth,height/2]),
        //screw right
        slottedHole(4,8,depth).rotateX(90).rotateY(90).translate([width-8,depth,height/2]),
        // z rod left
        cylinder({r:_ZrodsDiam/2,h:height+4,fn:_globalResolution}).translate([width/2-_ZrodsWidth/2,depth-15,-2]),
        //z rod right
        cylinder({r:_ZrodsDiam/2,h:height+4,fn:_globalResolution}).translate([width/2+_ZrodsWidth/2,depth-15,-2]),
        // chamfer
        roundBoolean2(10,height+4,"bl").rotateX(90).rotateZ(-90).translate([23,10,-2]),
        roundBoolean2(10,height+4,"bl").rotateX(90).translate([width-23,10,-2])
    );
    
    return mesh.translate([0,-depth,0]);
}

function zTop(){
    var width = _ZrodsWidth+_ZrodsDiam+(_rodsSupportThickness*2)+26;
    var height = 12;
    var depth = 30;
    var z_center = 25;

    // Z threaded rod
    return union(
        // bearing608z().translate([0,-z_center,height/2]).setColor(0.4,0.4,0.4),
        difference(
            zTopBase(width, depth, height).translate([-width/2,0,0]),
            // bearing hole
            union(
                bearing608z(),
                cylinder({r:(_ZscrewDiam+2)/2, h:height+4,fn: _globalResolution}).translate([0,0,-height/2-2])
            ).translate([0,-z_center,height/2])
        )
    );
}

function zBottom(){
    var width = _ZrodsWidth+_ZrodsDiam+(_rodsSupportThickness*2)+26;
    var height = 8;
    var depth = 45;
    var z_center = 25;
	
    // Z threaded rod
    return difference(
        zTopBase(width, depth, height).translate([-width/2,0,0]),
        nemaHole(_nemaXYZ).rotateX(0).translate([0,-z_center,-_nemaXYZ/2])
    );	
}

function slideZ(){
    var width = _ZrodsWidth-5;
    var height = 40;
    var depth = 5;
    var insideWidth = 35;
    var lmXuu_support_r = _rodsSupportThickness + _ZlmDiam / 2;
    var side_plate_size = 7;
    var side_form_size = lmXuu_support_r + side_plate_size;
    // lmXuu set screws offset
    var set_screw_offset = lmXuu_support_r + side_plate_size / 2 - 1;
	
    return difference(
        //main form
        union(
            cube({size:[width,depth,height]}).setColor(0.2,0.7,0.2),

        // lmXuu support
        cylinder({r:lmXuu_support_r,h:height,fn:_globalResolution}).setColor(0.2,0.7,0.2),
        cylinder({r:lmXuu_support_r,h:height,fn:_globalResolution}).translate([_ZrodsWidth,0,0]).setColor(0.2,0.7,0.2),
        // side forms for lmXuu attach
        cube({size:[side_form_size,10,height]}).translate([_ZrodsWidth,-4,0]).setColor(0.2,0.7,0.2),
        cube({size:[side_form_size,10,height]}).translate([-side_form_size,-4,0]).setColor(0.2,0.7,0.2),

            // extra forms front bearings holes
            cube([7,60,height]).translate([-3.5,-55,0]).setColor(0.2,0.7,0.2),
            cube([7,60,height]).translate([_ZrodsWidth-3.5,-55,0]).setColor(0.2,0.7,0.2),
            
            // nut holder
            cube([30,20,15]).translate([15,-20,height-15]).setColor(0.2,0.8,0.2)

        ),
        // nut hole
        cylinder({r:nutRadius, h:20, fn: 6}).translate([30,-10,height-25]),
        cylinder({r:12/2, h:height,fn: _globalResolution}).translate([30,-10,0]),
        //nut set nut hole
        cylinder({r:1.4,h:30,fn:_globalResolution}).rotateX(90).translate([30,15,height-10]),
        
        //  boolean front horizontal
        cylinder({r:60,h:width+40,fn:_globalResolution}).rotateY(90).translate([-20,-60,-25]),
        // cylinder({r:5,h:width+40,fn:_globalResolution}).rotateY(90).translate([-20,-15,height-10]),
        // z rod left linear bearing lm
        cylinder({r:_ZlmDiam/2,h:height,fn:_globalResolution}).translate([0,0,0]),
        //z rod right linear bearing lm
        cylinder({r:_ZlmDiam/2,h:height,fn:_globalResolution}).translate([_ZrodsWidth,0,0]),
        // side holes for lmXuu attach
        cube({size:[side_form_size+1,2,height]}).translate([_ZrodsWidth,0,0]),
        cube({size:[side_form_size+1,2,height]}).translate([-side_form_size-1,0,0]),
        // side holes for lmXuu screws
        cylinder({r:1.4,h:30,fn:_globalResolution}).rotateX(90).translate([_ZrodsWidth+set_screw_offset,20,height-10]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).rotateX(90).translate([_ZrodsWidth+set_screw_offset,20,10]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).rotateX(90).translate([-set_screw_offset,20,height-10]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).rotateX(90).translate([-set_screw_offset,20,10]),
        // top holes
        cylinder({r:1.4,h:30,fn:_globalResolution}).translate([0,-20,height-30]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).translate([_ZrodsWidth,-20,height-30]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).translate([0,-40,height-30]),
        cylinder({r:1.4,h:30,fn:_globalResolution}).translate([_ZrodsWidth,-40,height-30])
    );
}

function slideZsupport(){
    var mesh;
    var X = 7;
    var Y = 70;
    var Z = 50;
    mesh = difference(
        cube({size:[X,Y,Z]}),
        difference(
            cube({size:[X,Y,Z]}),
            roundBoolean2(20,10,"bl").rotateZ(90).translate([X,Y-20,Z-20])
        ).translate([0,-10,-10]),
        // side holes
        slottedHole(3.2,8,X).rotateX(90).rotateZ(90).translate([0,Y-5,Z-10]),
        slottedHole(3.2,8,X).rotateX(90).rotateZ(90).translate([0,Y-5,8]),
        //top holes
        cylinder({r:1.3,h:10,fn:_globalResolution}).translate([X/2,10,Z-10]),
        cylinder({r:1.3,h:10,fn:_globalResolution}).translate([X/2,Y-25,Z-10])

    );
    return mesh;
}


function extraSupportBed(){
    return difference(
        union(
        //base
        cube({size:[30,10,5]}),
        //middle
        cube({size:[14,10,15]}).translate([8,0,5])
        
        ),
        // hole for m5 rod
        slottedHole(5.2,15,12).rotateZ(90).rotateX(85).translate([15,11,12]),
        // screws
        cylinder({r:2.1,h:10,fn:_globalResolution}).translate([4,5,0]),
        cylinder({r:2.1,h:10,fn:_globalResolution}).translate([26,5,0])
    );
}

function slideY(side){
    var mesh;

    var Y = 50;
    var Z = 40;
    var bearingsOffsetZ = 16;
    var bearingsOffsetX = 20;
    var bearingsOffsetY = 9.5;
    var bearingHoleOffsetX = bearingsOffsetX+12;
    var X = 35;
    var xrodOffsetZ = 18;
    mesh =         
        union(
            difference(
                //main
                cube({size:[X,Y,Z]}).translate([15,0,0]),
                // support bearings
                cube({size:[X,Y,8]}).translate([10,0,bearingsOffsetZ]),
                cube({size:[X,Y,8]}).translate([10,0,bearingsOffsetZ+11])
            ),
            cube({size:[X+10,Y/2,Z-(bearingsOffsetZ+11+8)]}).translate([15-10,0,bearingsOffsetZ+11+8]),
            cube({size:[X+10,Y/2,3]}).translate([15-10,0,bearingsOffsetZ+8]),
            cube({size:[X+10,Y,bearingsOffsetZ]}).translate([15-10,0,0]),
            cube({size:[bearingsOffsetX,Y/2,19]}).translate([X-8,0,bearingsOffsetZ]),

            //extra rod Y support
            cylinder({r:_XYlmDiam/2+3,h:Y,fn:_globalResolution}).rotateX(-90).translate([14,0,0]),
            cube({size:[15,Y,6]}).translate([-4,0,-3])
        );

    // round bearings supports in middle
    if (side == "right") {
       mesh = union(
            mesh,
            // additional block for support
            cube({size:[bearingsOffsetX,Y/2,8]}).translate([X-8,Y/2,bearingsOffsetZ+11]),

            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ]),
            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ+7.5]),
            
            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ+11]),
            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ+11+7.5])
        );
    } else {
       mesh = union(
            mesh,
            // additional block for support
            cube({size:[bearingsOffsetX,Y/2,8]}).translate([X-8,Y/2,bearingsOffsetZ]),

            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ+11+7.5]),
            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ+11]),
            
            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ+7.5]),
            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ])
        );
    }

    // long, vertical bearing hole
    if (side == "right") {
       mesh = difference(
            mesh,
            cylinder({r:8/2,h:Z+4,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,-2]),
            cylinder({r:8/2,h:Z,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ]),
            cylinder({r:nutRadius,h:10,fn:6}).rotateZ(90).translate([bearingHoleOffsetX,Y-bearingsOffsetY,-3])
        );
    } else {
       mesh = difference(
            mesh,
            cylinder({r:8/2,h:Z,fn:_globalResolution}).translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ]),
            cylinder({r:8/2,h:Z+4,fn:_globalResolution}).translate([bearingHoleOffsetX-18,bearingsOffsetY,2]),
            cylinder({r:nutRadius,h:10,fn:6}).rotateZ(90).translate([bearingHoleOffsetX,Y-bearingsOffsetY,-3])
        );
    }

    mesh = difference (
        mesh,
        
/*
    // round top bearings
    difference(
        cube({size:[20,Y,Z]}).translate([10,0,20]),
        cylinder({r:Y/4,h:30,fn:_globalResolution}).translate([30,Y/4,20]),
        cylinder({r:Y/4,h:30,fn:_globalResolution}).translate([30,Y-Y/4,20])
    ),
*/
        
        // screw for endstop X
        //cylinder({r:1.3,h:12,fn:_globalResolution}).rotateX(90).translate([X+12,Y+1,13]),
        
        // rod Y bearing bool
        cylinder({r:_XYlmDiam/2+0.1,h:Y+5,fn:_globalResolution}).rotateX(-90).translate([14,0,0]),
        // rod Y support slice boolean 
        cube({size:[15,Y,1]}).translate([-5,0,-0.5]),
        // screws for rod Y support
        cylinder({r:1.3,h:10,fn:_globalResolution}).translate([0,10,-5]),
        cylinder({r:1.3,h:10,fn:_globalResolution}).translate([0,Y-10,-5]),
        
        // Xrods hole bottom
        cylinder({r:_XYrodsDiam/2,h:10,fn:_globalResolution}).rotateY(90).translate([X+5,Y-(_XYrodsDiam/2+3),15/2]),
        cylinder({r:_XYrodsDiam/2,h:10,fn:_globalResolution}).rotateY(90).translate([X+5,_XYrodsDiam/2+3,15/2]),
        
        // screw to attach the rod left
        cylinder({r:1.3,h:10,fn:_globalResolution}).rotateX(-90).translate([X+12,0,15/2]),
        // screw to attach the rod right
        cylinder({r:1.3,h:10,fn:_globalResolution}).rotateX(-90).translate([X+12,Y-10,15/2])
    );

/*    
    if(side=="left"){
        mesh = union(
                mesh,
                difference(
                    cube({size:[10,18,8]}).translate([22,-16,3]),
                    cylinder({r:1.3,h:16,fn:_globalResolution}).rotateY(90).translate([20,-13,7])
                )
                );
    }
*/

    if((output==1 || output == 7) && _exportReady != 1){
        if (side == "right") {
            mesh = union(
                    mesh.setColor(0.2,0.7,0.2),
                    bearing608z().translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ+0.5]),
                    bearing608z().translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ+11+0.5])
            );
        } else {
            mesh = union(
                    mesh.setColor(0.2,0.7,0.2),
                    bearing608z().translate([bearingHoleOffsetX-18,bearingsOffsetY,bearingsOffsetZ+0.5]),
                    bearing608z().translate([bearingHoleOffsetX,Y-bearingsOffsetY,bearingsOffsetZ+11+0.5])
            );
        }
    }

    return mesh;
}


function motorXY(){
    var thickness = 5;
    var mesh;
    var clearance = 0.2;
    var rodOffset = 23;
    mesh = difference(
        union(
            // base
            cube({size:[_nemaXYZ/2-5,_nemaXYZ+6,thickness+2]}),
            // wall support
            cube({size:[9,_nemaXYZ+6,20]}),
            //top and back fix
            cube({size:[_wallThickness+9.2,_nemaXYZ+6,thickness]}).translate([-_wallThickness-clearance,0,20]),
            cube({size:[thickness,_nemaXYZ+6,20+thickness]}).translate([-_wallThickness-thickness-clearance,0,0]),
            // rod support - half slotted hole
            cylinder({r:_XYrodsDiam/2+4,h:21,fn:_globalResolution}).rotateX(90).translate([rodOffset,_nemaXYZ+6,-3]),
            cylinder({r:thickness+2+3,h:21,fn:_globalResolution}).rotateX(90).translate([rodOffset,_nemaXYZ+6,-3]),
            cube({size:[rodOffset,rodOffset,_XYrodsDiam/2]}).translate([0,_nemaXYZ+6-rodOffset,2]),
            cube({size:[_XYrodsDiam*2+3,10,8]}).translate([0,_nemaXYZ-4,0]).rotateY(32.5)
        ),
        nemaHole(_nemaXYZ).translate([_nemaXYZ/2,_nemaXYZ/2,-1]),
        // rod support hole
        cylinder({r:_XYrodsDiam/2,h:24,fn:_globalResolution}).rotateX(90).translate([rodOffset,_nemaXYZ+10,-3]),
        //extra bool for printable
        cube({size:[10,10,10]}).translate([_nemaXYZ/2,22.3,0]),
        cube({size:[11.3*2,11.3*2,15]}).translate([_nemaXYZ/2,_nemaXYZ/2-11.3,-5]),
        // round
        roundBoolean2(5,_nemaXYZ+6,"br").translate([-_wallThickness-thickness-clearance,0,thickness+15]),
        //  holes to fix on the wood side - version simple
        // wood screw holes
        cylinder({r:2.1,h:20,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([-_wallThickness,6,5]),
        cylinder({r:2.1,h:20,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([-_wallThickness,_nemaXYZ,5]),
        // extra nema bool (motor body)
        cube({size:[_nemaXYZ,_nemaXYZ,_nemaXYZ]}).translate([0,0,-_nemaXYZ])
    );
    
    return mesh.setColor(0.2,0.7,0.2);
}


function bearingsXY(){
    var mesh;
    
    var Y = 20;
    var Z = 33;
    var bearingsOffsetZ = 10;
    var bearingsOffsetX = 10+_wallThickness;
    var bearingHoleOffsetX = bearingsOffsetX+14.5;
    var X = 22+_wallThickness;
    
    mesh = difference(
        
        union(
            difference(
            //main
                union(
                    cube({size:[X+2,Y,Z]}),
                    // round extremity - half cylinder
                    difference(
                        cylinder({r:Y/2,h:Z,fn:_globalResolution}).translate([X+2,Y/2,0]),
                        cube({size:[Y,Y,Z]}).translate([X-Y,0,0])
                    ),
                    // Y rod hole xtra
                    cylinder({r:_XYrodsDiam,h:12,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([17+_wallThickness,_XYrodsDiam,-6]),
                    //cube({size:[12,10,_XYrodsDiam]}).translate([8+_wallThickness,-8,0]),
                    cube({size:[12,5,_XYrodsDiam]}).translate([5+_wallThickness,0,-6]),
                    cube({size:[12,5,_XYrodsDiam]}).translate([5+_wallThickness,_XYrodsDiam*2-5,-6])
                ),
                // support bearings
                cube({size:[X+10,Y,8]}).translate([bearingsOffsetX,0,bearingsOffsetZ]),
                cube({size:[X+10,Y,8]}).translate([bearingsOffsetX,0,bearingsOffsetZ+11])
            ),


            // round bearings supports in middle
            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y/2,bearingsOffsetZ]),
            cylinder({r1:6,r2:5,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y/2,bearingsOffsetZ+11]),
            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y/2,bearingsOffsetZ+7.5]),
            cylinder({r1:5,r2:6,h:0.5,fn:_globalResolution}).translate([bearingHoleOffsetX,Y/2,bearingsOffsetZ+11+7.5])
            
        ),
        // long bearing hole
        cylinder({r:4.1,h:Z,fn:_globalResolution}).translate([bearingHoleOffsetX,Y/2,0]),
        // nut hole
        cylinder({r:nutRadius,h:6.6,fn:6}).rotateZ(90).translate([bearingHoleOffsetX,Y/2,0]),
        // wood support
        cube({size:[_wallThickness+0.2,Y,17]}).translate([5-0.2,0,0]),
        // Y rod hole
        cylinder({r:_XYrodsDiam/2,h:12,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([17+_wallThickness,_XYrodsDiam,-6]),
        //round
        roundBoolean2(10,Y,"br").translate([0,0,Z-10]),
        // xtra save material
        //cylinder({r:_XYrodsDiam,h:Y,fn:_globalResolution}).rotateX(-90).translate([27,0,20]),
        // wood screw holes
        cylinder({r:2.1,h:20,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([12,4,5]),
        cylinder({r:2.1,h:20,fn:_globalResolution}).rotateX(-90).rotateZ(90).translate([12,Y-4,5])

    );
    
    if(output==1){
        mesh = union(
            mesh.setColor(0.2,0.7,0.2),
            bearing608z().translate([bearingHoleOffsetX,Y/2,10.5]),
            bearing608z().translate([bearingHoleOffsetX,Y/2,21.5])
        );
    }
    
    return mesh;
}


//  ----------   non printed elements ------------

function _walls(){
    return union(
        //left 
        cube({size:[_wallThickness,_globalDepth+_wallThickness,_globalHeight]}).translate([-_globalWidth/2-_wallThickness,-_globalDepth/2,0]).setColor(1,0.5,0.3),
        
        // back
        cube({size:[_globalWidth,_wallThickness,_globalHeight]}).translate([-_globalWidth/2,_globalDepth/2,0]).setColor(0.9,0.4,0.3),
        
        // right
        cube({size:[_wallThickness,_globalDepth+_wallThickness,_globalHeight]}).translate([_globalWidth/2,-_globalDepth/2,0]).setColor(0.8,0.3,0.3),
        
        // bottom
        cube({size:[_globalWidth+_wallThickness*2,_globalDepth+_wallThickness,_wallThickness]}).translate([-_globalWidth/2-_wallThickness,-_globalDepth/2,-_wallThickness]).setColor(0.4,0.4,0.4).setColor(0.5,0.2,0.1)
    );
}

function wallSizeText(){
    return union(
        //left 
        text3d("left: "+(_globalDepth+_wallThickness)+" x "+_globalHeight).scale(0.5).rotateX(90).rotateZ(-90).translate([-_globalWidth/2-_wallThickness-3,0,_globalHeight/2]).setColor(0.2,0.3,0.2),
        // back
        text3d("back: "+ _globalWidth +" x "+_globalHeight).rotateX(90).scale(0.5).rotateZ(180).translate([0,_globalDepth/2+_wallThickness+3,_globalHeight/2]).setColor(0.2,0.3,0.2),
        // right
        text3d("right: "+(_globalDepth+_wallThickness)+" x "+_globalHeight).scale(0.5).rotateX(90).rotateZ(90).translate([_globalWidth/2+_wallThickness+3,0,_globalHeight/2]).setColor(0.2,0.3,0.2),
        // bottom
        text3d("bottom: "+(_globalWidth+(_wallThickness*2))+" x "+(_globalDepth+_wallThickness)).scale(0.5).translate([0,-_globalDepth/2,_wallThickness]).setColor(0.2,0.3,0.2)

    )
}

function _rodsXY() {
    var offsetFromTopY = 23;
    var offsetFromTopX = 23 - 15/2;
    return union(
        // rod X right
        cylinder({r:_XYrodsDiam/2,h:XrodLength,fn:_globalResolution}).rotateY(90).translate([-XrodLength/2,XaxisOffset+40-3+_XYrodsDiam/2,_globalHeight-offsetFromTopX]).setColor(0.3,0.3,0.3, 0.5),
        // rod x left
        cylinder({r:_XYrodsDiam/2,h:XrodLength,fn:_globalResolution}).rotateY(90).translate([-XrodLength/2,XaxisOffset+_XYrodsDiam/2+3,_globalHeight-offsetFromTopX]).setColor(0.3,0.3,0.3),
        
        // rod y left
        cylinder({r:_XYrodsDiam/2,h:YrodLength,fn:_globalResolution}).rotateX(90).translate([-_globalWidth/2+23,_globalDepth/2-5,_globalHeight-offsetFromTopY]).setColor(0.3,0.3,0.3),
        // rod y right
        cylinder({r:_XYrodsDiam/2,h:YrodLength,fn:_globalResolution}).rotateX(90).translate([_globalWidth/2-23,_globalDepth/2-10,_globalHeight-offsetFromTopY]).setColor(0.3,0.3,0.3)
    );    
}

function _rodsZ() {  
    var sideZrods = union(
        //rod Z left
        cylinder({r:_ZrodsDiam/2,h:ZrodLength,fn:_globalResolution}).translate([-_ZrodsWidth/2,-_wallThickness,0]).setColor(0.3,0.3,0.3),
        // rod z right
        cylinder({r:_ZrodsDiam/2,h:ZrodLength,fn:_globalResolution}).translate([_ZrodsWidth/2,-_wallThickness,0]).setColor(0.3,0.3,0.3)

        //rod Z left bearing
        //cylinder({r:_ZlmDiam/2,h:50,fn:_globalResolution}).translate([-_ZrodsWidth/2,-_wallThickness,_globalHeight/2-40]).setColor(0.5,0.5,0.5),
        // rod z right bearing
        //cylinder({r:_ZlmDiam/2,h:50,fn:_globalResolution}).translate([_ZrodsWidth/2,-_wallThickness-2,_globalHeight/2-40]).setColor(0.5,0.5,0.5)
    );
    return union(sideZrods.translate([0,_globalDepth/2,0]));
}

function _rods() {
    return union(_rodsXY(),_rodsZ());    	
}

function rodsLengthText(){
    var offsetFromTopY = 14;
    var offsetFromTopX = -5;
    return union(
        //x 
        text3d("rod X: "+XrodLength.toString()).scale(0.5).translate([-_globalWidth/2+55,XaxisOffset-10,_globalHeight-offsetFromTopX+5]).setColor(0.3,0.3,0.2),
        // y
        text3d("rod Y: "+YrodLength.toString()).scale(0.5).rotateZ(90).translate([-_globalWidth/2+20,_globalDepth/2-100,_globalHeight-offsetFromTopY+5]).setColor(0.3,0.3,0.2),
        // z
        text3d("rod Z: "+ZrodLength.toString()).scale(0.5).rotateX(90).translate([-_ZrodsWidth/2+10,_globalDepth/2-_wallThickness-10,_globalHeight/2-40]).setColor(0.3,0.3,0.2),
        text3d("screw Z: "+(ZrodLength-10).toString()).scale(0.5).rotateX(90).translate([-_ZrodsWidth/2+10,_globalDepth/2-_wallThickness-10,_globalHeight/2-70]).setColor(0.3,0.3,0.2),
        // belt
        text3d("belt length xy: " + ((XrodLength + beltXAddon)*4 + (YrodLength + beltYAddon)*4)).scale(0.5).translate([-_globalWidth/2+55,XaxisOffset-50,_globalHeight-offsetFromTopX+5]).setColor(0.9,0.3,0.2)
    );
}

function _timingPulley(){
    return union (
        // timing pulley - height: 14
        cylinder({r:16/2,h:1,fn:_globalResolution}).translate([0,0,13]),
        cylinder({r:12.5/2,h:8,fn:_globalResolution}).translate([0,0,5]),
        cylinder({r:16/2,h:5,fn:_globalResolution})
    )
}

function _nema(){
    return _nemaBase(1);
}

function _nemaWithoutPulley(){
    return _nemaBase(0);
}

function _nemaBase(addPulley){
    var offset = ((_nemaXYZ==35) ? 26 : 31) / 2;
    var shaftWidth = 24;
    
    mesh = union(
        cube({size:_nemaXYZ}).setColor(0.3,0.3,1.0),
        cylinder({r:11,h:2,fn:_globalResolution}).translate([_nemaXYZ/2,_nemaXYZ/2,_nemaXYZ]),
        cylinder({r:2.5,h:shaftWidth,fn:_globalResolution}).translate([_nemaXYZ/2,_nemaXYZ/2,_nemaXYZ+2])
    );
    
    //GT2 20T gear
    if (addPulley == 1){
        mesh = union (
            mesh,
            _timingPulley().translate([_nemaXYZ/2,_nemaXYZ/2,_nemaXYZ+2+shaftWidth-14])
        );
    }


    mesh = difference(
        mesh,
        cylinder({r:1.5,h:5,fn:_globalResolution}).translate([_nemaXYZ/2-offset,_nemaXYZ/2+offset,_nemaXYZ-4]),
        cylinder({r:1.5,h:5,fn:_globalResolution}).translate([_nemaXYZ/2+offset,_nemaXYZ/2+offset,_nemaXYZ-4]),
        cylinder({r:1.5,h:5,fn:_globalResolution}).translate([_nemaXYZ/2-offset,_nemaXYZ/2-offset,_nemaXYZ-4]),
        cylinder({r:1.5,h:5,fn:_globalResolution}).translate([_nemaXYZ/2+offset,_nemaXYZ/2-offset,_nemaXYZ-4])
    );

    return mesh;
}

function _bed(){
    var mesh = difference(
        cube({size:[_printableWidth/2,_printableDepth+30,3]}).setColor(0.8,0.8,0.4,0.5)
    );
    mesh.properties.clipbackleft = new CSG.Connector([0, _printableDepth, 0], [1, 0, 0], [0, 0, 1]);
    mesh.properties.clipbackright = new CSG.Connector([_printableWidth, _printableDepth, 0], [1, 0, 0], [0, 0, 1]);
    mesh.properties.clipfrontleft = new CSG.Connector([0,0, 0], [1, 0, 0], [0, 0, 1]);
    mesh.properties.clipfrontright = new CSG.Connector([_printableWidth,0, 0], [1, 0, 0], [0, 0, 1]);

    return mesh;
}



// -----------------------  lib
// generate screws 
function Mx(diam,length){
    return union(
        cylinder({r:diam/2+1,h:3,fn:_globalResolution}),
        cylinder({r:diam/2,h:length,fn:_globalResolution}).translate([0,0,3])
    )
}


function text3d(what){
    var l = vector_text(0,0,what);   
    var o = [];
    l.forEach(function(pl) {                   
        o.push(rectangular_extrude(pl, {w: 5, h: 2}));   
    });
    return union(o);
}

function tube(dint,dext,length){
    return difference(
        cylinder({r:dext/2,h:length,fn:_globalResolution}),
        cylinder({r:dint/2,h:length,fn:_globalResolution})
    );
}

function _axis(){
    return union(
        cube({size:[10,1,1]}).setColor(1,0,0),
        cube({size:[1,10,1]}).setColor(0,1,0),
        cube({size:[1,1,10]}).setColor(0,0,1)
    );
}

function nemaHole(){
    var offset = (_nemaXYZ==35) ? 13 : 15.5;
    return union(
        cylinder({r:11.3,h:40,fn:_globalResolution}),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([-offset,-offset,0]),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([offset,-offset,0]),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([-offset,offset,0]),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([offset,offset,0])
    );
}

// only 2 screw holes
function nemaHole2(){
    var offset = (_nemaXYZ==35)?13:15.5;
    return union(
        cylinder({r:11.3,h:40,fn:_globalResolution}),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([-offset,-offset,0]),
        //cylinder({r:1.6,h:40,fn:_globalResolution}).translate([offset,-offset,0]),
        cylinder({r:1.6,h:40,fn:_globalResolution}).translate([-offset,offset,0])
        //cylinder({r:1.6,h:40,fn:_globalResolution}).translate([offset,offset,0])
    );
}

function slottedHole(diam,length,height){
    return union(
        cylinder({r:diam/2,h:height,fn:_globalResolution}),
        cube([diam,length-diam,height]).translate([-diam/2,0,0]),
        cylinder({r:diam/2,h:height,fn:_globalResolution}).translate([0,length-diam,0])
    );
}

function bearingSupport(baseHeight){
    return difference(
        union(
            cylinder({r:5,h:baseHeight,fn:_globalResolution}),
            cylinder({r:4,h:6,fn:_globalResolution}).translate([0,0,baseHeight])
        ),
        cylinder({r:1.4,h:baseHeight+7,fn:_globalResolution})
    );
}

function bearingSupport2(baseHeight){
    return difference(
        union(
            cylinder({r:5,h:baseHeight,fn:_globalResolution}),
            cylinder({r:4,h:16,fn:_globalResolution}).translate([0,0,baseHeight])
        ),
        cylinder({r:1.4,h:baseHeight+16,fn:_globalResolution})
    );
}

function bearingTop(hole){
    return difference(
        union(
            cylinder({r:5,h:1,fn:_globalResolution}),
            cylinder({r:13,h:1.5,fn:_globalResolution}).translate([0,0,1])
        ),
        cylinder({r:hole/2+0.1,h:6,fn:_globalResolution})
    );
}

function bearingMiddle(hole){
    return difference(
        union(
            cylinder({r:5,h:1,fn:_globalResolution}),
            cylinder({r:13,h:1,fn:_globalResolution}).translate([0,0,1])
        ),
        cylinder({r:hole/2+0.1,h:6,fn:_globalResolution})
    );
}

function bearing608z(){
    return difference(
        cylinder({r:11,h:7,fn:_globalResolution}).setColor(0.4,0.4,0.4),
        cylinder({r:4,h:7,fn:_globalResolution})
    );
}

function Gt2Holder(boolOffset,height){
    var h = 10;
    var beltThickness = 0.9;
    if(height){h=height;}
    return difference(
        linear_extrude({height:10},polygon({points:[[0,0],[16,0],[12,h],[4,h]]})).translate([-12,0,-h]).rotateY(-90).rotateX(90),
        union(
            cube([10,1,h-3]).translate([h-10,boolOffset,3]),
            cube([1,1,h-3]).translate([h-9,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-7,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-5,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-3,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-1,boolOffset+beltThickness,3])
        )
    )
}

function Gt2HolderSuspendedRight(boolOffset,height){
    var h = 10;
    var beltThickness = 0.9;
    if(height){h=height;}
    return difference(
        linear_extrude({height:10},polygon({points:[[0,0],[12,-h],[16,0],[12,h],[4,h]]})).translate([-12,0,-h]).rotateY(-90).rotateX(90),
        union(
            cube([10,1,h-3]).translate([h-10,boolOffset,3]),
            cube([1,1,h-3]).translate([h-9,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-7,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-5,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-3,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-1,boolOffset+beltThickness,3])
        )
    )
}

function Gt2HolderSuspendedLeft(boolOffset,height){
    var h = 10;
    var beltThickness = 0.9;
    if(height){h=height;}
    return difference(
        linear_extrude({height:10},polygon({points:[[0,0],[4,-h],[16,0],[12,h],[4,h]]})).translate([-12,0,-h]).rotateY(-90).rotateX(90),
        union(
            cube([10,1,h-3]).translate([h-10,boolOffset,3]),
            cube([1,1,h-3]).translate([h-9,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-7,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-5,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-3,boolOffset+beltThickness,3]),
            cube([1,1,h-3]).translate([h-1,boolOffset+beltThickness,3])
        )
    )
}

function Gt2HolderBool(boolOffset,height){
    var h = 10;
    var beltThickness = 0.9;
    if(height){h=height;}
    return union(
        cube([10,1,h-3]).translate([h-10,boolOffset,3]),
        cube([1,1,h-3]).translate([h-9,boolOffset+beltThickness,3]),
        cube([1,1,h-3]).translate([h-7,boolOffset+beltThickness,3]),
        cube([1,1,h-3]).translate([h-5,boolOffset+beltThickness,3]),
        cube([1,1,h-3]).translate([h-3,boolOffset+beltThickness,3]),
        cube([1,1,h-3]).translate([h-1,boolOffset+beltThickness,3])
    )
}

function Gt2Holder3(boolOffset,height){
    var h = 10;
    if(height){h=height;}
    return difference(
        linear_extrude({height:10},polygon({points:[[0,0],[16,0],[12,h],[4,h]]})).translate([-12,0,-h]).rotateY(-90).rotateX(90),
        union(
            cube([10,1,h-3]).translate([h-10,boolOffset,6]),
            cube([1,1,h-3]).translate([h-9,boolOffset+1,6]),
            cube([1,1,h-3]).translate([h-7,boolOffset+1,6]),
            cube([1,1,h-3]).translate([h-5,boolOffset+1,6]),
            cube([1,1,h-3]).translate([h-3,boolOffset+1,6]),
            cube([1,1,h-3]).translate([h-1,boolOffset+1,6])

        )
    )
}
function Gt2Holder2(){
    var beltThickness = 0.9;
    return difference(
        linear_extrude({height:23},polygon({points:[[0,0],[16,0],[12,10],[4,10]]})).translate([-12,0,-10]).rotateY(-90).rotateX(90),
        union(
            cube([23,1,7]).translate([-13,3,3]),
            cube([1,1,7]).translate([-11,3+beltThickness,3]),
            cube([1,1,7]).translate([-9,3+beltThickness,3]),
            cube([1,1,7]).translate([-7,3+beltThickness,3]),
            cube([1,1,7]).translate([-5,3+beltThickness,3]),
            cube([1,1,7]).translate([-3,3+beltThickness,3]),
            cube([1,1,7]).translate([-1,3+beltThickness,3]),
            cube([1,1,7]).translate([1,3+beltThickness,3]),
            cube([1,1,7]).translate([3,3+beltThickness,3]),
            cube([1,1,7]).translate([5,3+beltThickness,3]),
            cube([1,1,7]).translate([7,3+beltThickness,3]),
            cube([1,1,7]).translate([9,3+beltThickness,3]),
            cube([1,1,7]).translate([11,3+beltThickness,3])
        )
    )
}

function endstop_meca(){
    return difference(
        cube([40,15,7]),
        cylinder({r:1.5,h:8,fn:_globalResolution}).translate([2.5,2.5,0]),
        cylinder({r:1.5,h:8,fn:_globalResolution}).translate([2.5+14,2.5,0]),
        cylinder({r:1.5,h:8,fn:_globalResolution}).translate([40-2.5,2.5,0])
    );
}

function roundBoolean(diam,w,d,h,edge){
    var bool;
    if(edge=="bl"){bool = cylinder({r:diam/2,h:d,fn:_globalResolution}).rotateX(-90).translate([0,0,0]);}
    if(edge=="tl"){bool = cylinder({r:diam/2,h:d,fn:_globalResolution}).rotateX(-90).translate([0,0,h]);}
    if(edge=="br"){bool = cylinder({r:diam/2,h:d,fn:_globalResolution}).rotateX(-90).translate([w,0,0]);}
    if(edge=="tr"){bool = cylinder({r:diam/2,h:d,fn:_globalResolution}).rotateX(-90).translate([w,0,h]);}
    return difference(
        cube([w,d,h]),
        bool
    );
}

function roundBoolean2(diam,length,edge){
    var bool;
    if(edge=="bl"){bool = cylinder({r:diam,h:length,fn:_globalResolution}).rotateX(-90).translate([0,0,0]);}
    if(edge=="tl"){bool = cylinder({r:diam,h:length,fn:_globalResolution}).rotateX(-90).translate([0,0,diam]);}
    if(edge=="br"){bool = cylinder({r:diam,h:length,fn:_globalResolution}).rotateX(-90).translate([diam,0,0]);}
    if(edge=="tr"){bool = cylinder({r:diam,h:length,fn:_globalResolution}).rotateX(-90).translate([diam,0,diam]);}
    return difference(
        cube([diam,length,diam]),
        bool
    );
}

// align parts so they are on z=0 and no touching
function makeplate(parts){
    var deltaX = 5;
    var deltaY = 5;
    var oldbox;
    var i;
    var currentX = -100;
    var currentY = -100;
    var nextY = 0;
    var maxX = 100;
    var maxY = 100;
    var currentPlate = 0;
    for(i =0;i < parts.length;i++){
        var box = parts[i].getBounds();
        var nextX = currentX + (box[1].x-box[0].x)+deltaX;
        if(nextX > maxX){
            currentX = -100;
            currentY = currentY + nextY + deltaY;
            nextY = 0;
        }
        
        parts[i] = parts[i].translate([currentX-box[0].x+deltaX,currentY-box[0].y+deltaY,-box[0].z]);
        currentX = currentX + (box[1].x-box[0].x)+deltaX ;
        nextY = Math.max(nextY,(box[1].y-box[0].y));
    }
    return parts;
}





// -----------------------  start here 

function main(params){

    // -------- sandbox ------- 
    //return _walls();
    //var infos = document.getElementById("dimensionsInfos");
    //infos.innerHTML = "hello there";


    // assign globals from interface parameters
    _printableWidth=params._printableWidth; 
    _printableHeight=params._printableHeight; 
    _printableDepth=params._printableDepth; 
    _wallThickness=params._wallThickness; 
    _XYrodsDiam = params._XYrodsDiam;
    _ZrodsDiam = params._ZrodsDiam;
    _globalResolution = params._globalResolution;
    _nemaXYZ=parseInt(params._nemaXYZ);
    output=parseInt(params._output); 
    _rodsVisibility=parseInt(params._rodsVisibility);
    _exportReady=parseInt(params._exportReady);
    //_extrusionType = params.extrusionType;
    _extrusionType = 1;
    // update calculated values 
    if(_XYrodsDiam==6){ _XYlmDiam = 12;}
    if(_XYrodsDiam==8){ _XYlmDiam = 15;}
    if(_XYrodsDiam==10){ _XYlmDiam = 19;}
    if(_ZrodsDiam==6){ _ZlmDiam = 12;}
    if(_ZrodsDiam==8){ _ZlmDiam = 15;}
    if(_ZrodsDiam==10){ _ZlmDiam = 19;}
    if(_ZrodsDiam==12){ _ZlmDiam = 21;}


    _globalDepth = _printableDepth + 110; // = motor support depth + bearings depth + head depth /2
    _globalWidth = _printableWidth + 165; // = motor uspport width + bearings width + head width /2
    _globalHeight = _printableHeight + 140; // bottom = 40mm head = 40 mm + extra loose.

    XrodLength = _printableWidth + 65; // 40: slideY width , 3: offset slideY from wall.
    YrodLength = _printableDepth + 65; // 5: rod support inside parts.
    ZrodLength = _printableHeight + 130;


    echo("wood depth:"+_globalDepth + " width:"+_globalWidth+" height:"+_globalHeight);
    echo("X rod length:"+XrodLength + " Y rod length:"+YrodLength+" Zrodlength:"+ZrodLength+" Zscrewlength:"+(ZrodLength-10));
    // calculate some usefull vars
    var ztopbottomX = (_ZrodsWidth+_ZrodsDiam+(_rodsSupportThickness*2))/2;
    var zslideX = (_ZrodsWidth+_ZlmDiam+(_rodsSupportThickness*2))/2;

    
    
var res=null;


switch(output){
    case 0:
    // connections
        /*var bed = _bed().translate([-_printableWidth/2,-_printableDepth/2+35,_globalHeight/2+10]); 
        var clipGlassBackleft = clipGlassBack();
        var clipGlassBackright = clipGlassBack();
        var clipGlassFrontLeft = clipGlassFront();
        var clipGlassFrontRight = clipGlassFront();
        clipGlassBackleft = clipGlassBackleft.connectTo(clipGlassBackleft.properties.connect1,bed.properties.clipbackleft,false,0);
        clipGlassBackright = clipGlassBackright.connectTo(clipGlassBackright.properties.connect1,bed.properties.clipbackright,true,0);
        clipGlassFrontLeft = clipGlassFrontLeft.connectTo(clipGlassFrontLeft.properties.connect1,bed.properties.clipfrontleft,false,0);
        clipGlassFrontRight = clipGlassFrontRight.connectTo(clipGlassFrontRight.properties.connect1,bed.properties.clipfrontright,true,0);
*/
        res = [  
            _nema().translate([-_globalWidth/2,-_globalDepth/2,_globalHeight-_nemaXYZ-20]),
            motorXY().translate([-_globalWidth/2,-_globalDepth/2,_globalHeight-20]),
            slideY().translate([-_globalWidth/2+6,XaxisOffset,_globalHeight-22]),
            _rods(),
            bearingsXY().rotateZ(-90).translate([-_globalWidth/2+_wallThickness+18,_globalDepth/2+_wallThickness+5,_globalHeight-17])
        ];
        //res.push(JheadAttach().translate([headoffset-13,XaxisOffset-12,_globalHeight]));
        
        //res.push(fakeJhead().translate([headoffset+23,XaxisOffset-12,_globalHeight-38]).setColor(0.2,0.2,0.2));
    break;
    case 1:
        res = [
            _walls(),
            
            //nema left
            _nemaWithoutPulley().translate([-_globalWidth/2,-_globalDepth/2,_globalHeight-_nemaXYZ-20]),
            // nema right
            _nemaWithoutPulley().translate([_globalWidth/2-_nemaXYZ,-_globalDepth/2,_globalHeight-_nemaXYZ-20]),

            motorXY().translate([-_globalWidth/2,-_globalDepth/2,_globalHeight-20]),
            motorXY().mirroredX().translate([_globalWidth/2,-_globalDepth/2,_globalHeight-20]),
            bearingsXY().rotateZ(-90).translate([-_globalWidth/2+_XYrodsDiam+3,_globalDepth/2+_wallThickness+5,_globalHeight-17]),
            bearingsXY().mirroredX().rotateZ(90).translate([_globalWidth/2-_XYrodsDiam-3,_globalDepth/2+_wallThickness+5,_globalHeight-17]),
            slideY("right").translate([-_globalWidth/2+9,XaxisOffset,_globalHeight-23]),
            slideY("left").mirroredX().translate([_globalWidth/2-9,XaxisOffset,_globalHeight-23]),
            //endstop x
            //endstop_meca().rotateZ(90).rotateX(-90).translate([-_globalWidth/2+56,XaxisOffset+18,_globalHeight-9]),
            //endstop y
            //endstop_meca().rotateY(-90).translate([-_globalWidth/2+43,XaxisOffset-15,_globalHeight-52]).setColor(0.2,0.2,0.2),
            
            ];

            if (_rodsVisibility == 1) {
                res.push(_rods());
            }
            
            // Z stage 
            // zres = [                    
                // cylinder({r:_ZscrewDiam/2,h:ZrodLength-10,fn:_globalResolution}).translate([0,_globalDepth/2-25,5]).setColor(0.9,0.3,0.3),
                // _nema().rotateX(180).translate([-_nemaXYZ/2+80,_globalDepth/2,_nemaXYZ+30]),
                // zTop().translate([0,_globalDepth/2,_globalHeight-35]),
                // zTop().translate([0,_globalDepth/2,30]),                    
                // slideZ().translate([-_ZrodsWidth/2,_globalDepth/2-15,_globalHeight/2-30]),
                // // _bed().translate([-_printableWidth/4,-_printableDepth/2,_globalHeight/2+10]);                    
                
                // _timingPulley().rotateX(180).translate([0,_globalDepth/2-25,20])

            // ];
            // res.push(union(zres));

            
            //bowden
/*
            if(_extrusionType==1){
                //res.push(JheadAttach().translate([headoffset-12,XaxisOffset-17,_globalHeight+6]));
                res.push(HeadSupportJhead().rotateZ(180).translate([headoffset+44,XaxisOffset,_globalHeight-14]));
                res.push(fakeJhead().translate([headoffset+23,XaxisOffset-15,_globalHeight-32]).setColor(0.2,0.2,0.2));
                // fake inductive sensor
                res.push(cylinder({r:9,h:70,fn:_globalResolution}).translate([headoffset+57,XaxisOffset-25,_globalHeight-40]).setColor(0.2,0.2,0.2));
                res.push(InductiveSensorSupport().translate([headoffset+2,XaxisOffset-30,_globalHeight+13]));
                
                // nema extruder
                res.push(_nema().rotateX(90).translate([_globalWidth/2+_wallThickness+5,-_globalDepth/2+_nemaXYZ+55,_globalHeight-_nemaXYZ-25]));
                res.push(extruder(_extrusionType).rotateX(90).translate([_globalWidth/2+_wall_wallThickness+26,-_globalDepth/2+60,_globalHeight-50]));

            }
            // direct
            if(_extrusionType==0){
                res.push(InductiveSensorSupport().translate([headoffset+6,-(_XYlmDiam/2+(_rodsSupportThickness*2))+XaxisOffset+57,_globalHeight-28]));
                // nema extruder
                res.push(_nema().rotateX(-90).translate([headoffset+2,XaxisOffset,_globalHeight+50]));
                res.push(extruder(_extrusionType).rotateX(-90).translate([headoffset+22,XaxisOffset+47,_globalHeight+30]));
            }
*/
    break;
    case 2:

        res = [

            motorXY().rotateX(-90),
            motorXY().mirroredX().rotateX(-90),

            bearingsXY().rotateX(-90),
            bearingsXY().mirroredX().rotateX(-90),

            slideY("left").rotateX(90),
            slideY("right").mirroredX().rotateX(90),

            headLeft().rotateY(-90),
            headRight().rotateY(90),

            zTop(),
            zBottom(),
            slideZ().rotateX(180)
            
                ];
            //bowden
            
            if(_extrusionType==1){
                res.push(InductiveSensorSupport().rotateX(180));
                res.push(HeadSupportJhead().rotateX(90));
                // nema extruder
                res.push(extruder(_extrusionType,0));
                res.push(extruder(_extrusionType,1).rotateX(180));

            }
            // direct
            if(_extrusionType==0){
                res.push(InductiveSensorSupport());
                // nema extruder
                res.push(extruder(_extrusionType,0));
                res.push(extruder(_extrusionType,1).rotateX(180));
            }
            res = makeplate(res);

    break;
    case 3:
        res = [
            motorXY().translate([-_globalWidth/2,-_globalDepth/2,_globalHeight-20]),
            motorXY().mirroredX().translate([_globalWidth/2,-_globalDepth/2,_globalHeight-20]),
            bearingsXY().rotateZ(-90).translate([-_globalWidth/2+_wallThickness+18,_globalDepth/2+_wallThickness+5,_globalHeight-17]),
            bearingsXY().mirroredX().rotateZ(90).translate([_globalWidth/2-_wallThickness-18,_globalDepth/2+_wallThickness+5,_globalHeight-17]),
            slideY().translate([-_globalWidth/2+4,XaxisOffset,_globalHeight-22]),
            slideY().mirroredX().translate([_globalWidth/2-4,XaxisOffset,_globalHeight-22]),

            
            headLeft().translate([headoffset,XaxisOffset,_globalHeight-26]),
            headRight().translate([headoffset+32,XaxisOffset,_globalHeight-26]),
            // Z stage 
            zTop().translate([0,_globalDepth/2-_wallThickness-5,_globalHeight-35]),
            zBottom().translate([0,_globalDepth/2-_wallThickness,_wallThickness]),
            
            slideZ().translate([-_ZrodsWidth/2,_globalDepth/2-_wallThickness-4,_globalHeight/2-30]),

                ];

            //bowden
            if(_extrusionType==1){
                //res.push(JheadAttach().translate([headoffset-12,XaxisOffset-17,_globalHeight+6]));
                res.push(HeadSupportJhead().rotateZ(180).translate([headoffset+44,XaxisOffset,_globalHeight-14]));
                res.push(InductiveSensorSupport().translate([headoffset+2,XaxisOffset-30,_globalHeight+13]));

                res.push(extruder(_extrusionType).rotateX(90).translate([_globalWidth/2+_wallThickness+26,-_globalDepth/2+60,_globalHeight-50]));

            }
            // direct
            if(_extrusionType==0){
                res.push(InductiveSensorSupport().translate([headoffset+6,-(_XYlmDiam/2+(_rodsSupportThickness*2))+XaxisOffset+57,_globalHeight-28]));
                res.push(extruder(_extrusionType).rotateX(-90).translate([headoffset+22,XaxisOffset+47,_globalHeight+30]));
            }
    break;
    case 4:
        res = [
            wallSizeText(),
            _walls(),
            rodsLengthText(),
            _rods()
        ];
    break;
    case 5:
        if (_exportReady == 1) {
            res = [
                motorXY().rotateX(-90),
                motorXY().mirroredX().rotateX(-90)
            ];
            makeplate(res);
        } else {
            res = [
                //_rods(),
                _nema().translate([0,0,-_nemaXYZ]),
                motorXY()
            ];
        }
    break;
    case 6:
        res = [];
        if (_exportReady == 1) {
            res.push(bearingsXY().rotateX(90));
        } else {
            res.push(bearingsXY());
        }
    break;
    case 7:
        if (_exportReady == 1) {
            _globalResolution = 48;
            res = [
                slideY("left").rotateX(90),
                slideY("right").mirroredX().rotateX(90)
            ];
            makeplate(res);
        } else {
            res = [
                _rods().translate([_globalWidth/2-6,-XaxisOffset,-_globalHeight+22]),
                slideY("right"),
                slideY("left").mirroredX().translate([130,0,0])
            ];
        }
    break;
    case 8:
        res = [zTop()];
    break;
    case 9:
        res = zBottom();
    break;
    case 10:
        res = [slideZ()
        //slideZsupport().translate([40,0,0]),
        //extraSupportBed().translate([0,-50,0])
            /*slideZ().translate([_ZrodsWidth/2-1,_globalDepth/2-_wallThickness-70,_globalHeight/2-40]),
            slideZBearingsSupport().mirroredX().translate([_ZrodsWidth/2-2,_globalDepth/2-_wallThickness-15,_globalHeight/2-40]),
            slideZ().mirroredX().translate([-_ZrodsWidth/2+1,_globalDepth/2-_wallThickness-70,_globalHeight/2-40]),
            slideZBearingsSupport().translate([-_ZrodsWidth/2+2,_globalDepth/2-_wallThickness-15,_globalHeight/2-40]),
            slideZBeltAttach().translate([-_ZrodsWidth/2+13,_globalDepth/2-_wallThickness-15,_globalHeight/2-40])*/
            ];
    break;
    case 11:
        // Z threaded rods
        _ZscrewDiam = 8;
        res = [
            cylinder({r:_ZscrewDiam/2,h:ZrodLength,fn:_globalResolution}).translate([-_ZrodsWidth/2+30,-25,-120]).setColor(0.9,0.3,0.3),
            _rodsZ().translate([0,-_globalDepth/2,-100]),
            slideZ().translate([-30,-15,0]),
            zTop().translate([0,0,100]),
            zTop().translate([0,0,-100])
        ];
    break;
    case 12:
        res = [headLeft(),headRight().translate([0,60,0])];
    break;
    case 13:
        res = [ extruder(_extrusionType,0),extruder(_extrusionType,1).rotateX(180).translate([60,0,0])
        ];
    break;
    
    default:
    break;
}

return res;
}

 