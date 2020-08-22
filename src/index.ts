import { Namespace } from "./helpers/Namespace";

/* Build the structure of the SDK */

import * as baseLayer from "./layer";
const layer = Namespace.merge("atlas.layer", baseLayer);

//Merge the local controls into the 'atlas.animations' namespace.
import * as baseAnimations from "./animations";
const animations = Namespace.merge("atlas.animations", baseAnimations);
export { animations, layer };
