# Inspiration research

Research checked November 10, 2026. The app reinterprets workflow concepts using original code and assets.

- [Maxon: MoGraph Basics](https://www.maxon.net/en/cinema-4d/features/mograph-basics) describes arranging live copies with a Cloner and animating them with effectors. Orbitweave focuses on that immediate relationship between one primitive, many clones, and motion.
- [Maxon: Effectors](https://help.maxon.net/c4d/2025/en-us/Content/html/7443.html) describes modifying clone position, size, and angle. Orbitweave implements three deliberately small transformations: wave, scatter, and twist.
- [Maxon: Cloner Object, Effectors tab](https://help.maxon.net/c4d/s22/us/html/OMOGRAPH_CLONER-ID_MG_MOTIONGENERATOR_GROUP_EFFECTORS.html) explains enabling/disabling effectors and the significance of their order. Orbitweave provides independent toggles with a fixed, documented order rather than a full editable stack.
- [Maxon: Fields](https://help.maxon.net/c4d/2024/en-us/Content/html/58091.html?TocPath=Create+Menu%7CField%7C_____0) explains spatial influence over procedural effects. Orbitweave includes one radial falloff weight to demonstrate the concept.

## Scope decision

The manageable vertical slice is a procedural motion-graphics playground: three distributions, two primitives, real transform math, periodic animation, a camera, editable project files, and PNG export. Canvas 2D projection keeps the build dependency-free. It does not claim professional rendering, modeling, or Cinema 4D file compatibility. Original palettes, geometry, and interface layout form an independent visual identity.
