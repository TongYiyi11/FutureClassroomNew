import * as global from "../global.js";
import { Gltf2Node } from "../render/nodes/gltf2.js";

export default () => {

   global.scene().addNode(new Gltf2Node({
      url: "./media/gltf/sponza/Sponza.gltf"
   }));

   return {
      enableSceneReloading: true,
      scenes: [
         { name: "DemoCube"   , path: "./demoCube.js"    },
         { name: "Demo4D"     , path: "./demo4D.js"      },
         { name: "DemoHitRect", path: "./demoHitRect.js" },
         { name: "DemoDots"   , path: "./demoDots.js"    },
         { name: "DemoBlobs"  , path: "./demoBlobs.js"   },
         { name: "DemoDrum"   , path: "./demoDrum.js"    },
      ]
   };
}
