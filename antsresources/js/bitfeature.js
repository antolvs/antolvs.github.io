(() => {
    "use strict";

    const holder = document.getElementById("bit-holder");
    if (!holder || typeof p5 === "undefined") return;

    const ASSETS   = "/antsresources/bit/";
    // canvas height
    const REF_SIZE = 700;
    const ZOOM     = 1;
    const VOLUME = 0.1;

    new p5(p => {
        let obj1, obj2, obj3, obj4, yesSound, noSound;
        // box size
        let k = 1;

        // wandering
        let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
        let lastMoveTime = 0, easingStartTime = 0;
        const moveDelay = 2000, moveDuration = 30000;

        // yes/no animation
        let scaling = false, pickedYes = false, scaleStartTime = 0;
        const minScale = 0.2, minObj = 0.1, maxObj = 1;
        const downMs = 300, holdMs = 200, upMs = 400;

        let lastClickTime = 0;
        const cooldown = 1000;

        const boxSize = () => Math.max(Math.floor(holder.clientWidth) || 211, 100);
        const setK = s => { k = (s / REF_SIZE) * ZOOM; };
        const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
        const easeInOutQuad = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

        p.preload = () => {
            obj1 = p.loadModel(ASSETS + "bit_1.obj");
            obj2 = p.loadModel(ASSETS + "bit_2.obj");
            obj3 = p.loadModel(ASSETS + "bit_yes.obj");
            obj4 = p.loadModel(ASSETS + "bit_no.obj");
            yesSound = p.loadSound(ASSETS + "yes.mp3");
            noSound = p.loadSound(ASSETS + "no.mp3");
        };

        p.setup = () => {
            const s = boxSize();
            setK(s);
            p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
            yesSound.setVolume(VOLUME);
            noSound.setVolume(VOLUME);
            const cnv = p.createCanvas(s, s, p.WEBGL);
            cnv.mousePressed(handleClick);
            pickNewTarget();
            easingStartTime = p.millis();

            if (window.ResizeObserver) {
                new ResizeObserver(() => {
                    const w = holder.clientWidth;
                    if (w > 0 && w !== p.width) {
                        p.resizeCanvas(w, w);
                        setK(w);
                    }
                }).observe(holder);
            }

            // bit go bye bye when tabbed out
            let visible = true;
            const sync = () => (visible && !document.hidden ? p.loop() : p.noLoop());
            if (window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    visible = entries[0].isIntersecting;
                    sync();
                }).observe(holder);
            }
            document.addEventListener("visibilitychange", sync);
        };

        p.draw = () => {
            p.background(0);
            p.noStroke();
            p.lights();

            const now = p.millis();
            if (now - lastMoveTime > moveDelay) {
                pickNewTarget();
                lastMoveTime = now;
                easingStartTime = now;
            }
            const t = easeOutExpo(Math.min((now - easingStartTime) / moveDuration, 1));
            currentX = p.lerp(currentX, targetX, t);
            currentY = p.lerp(currentY, targetY, t);

            let u = 0;
            if (scaling) {
                const e = now - scaleStartTime;
                if (e < downMs) u = easeInOutQuad(e / downMs);
                else if (e < downMs + holdMs) u = 1;
                else if (e < downMs + holdMs + upMs) u = 1 - easeInOutQuad((e - downMs - holdMs) / upMs);
                else scaling = false;
            }
            const bitScale = p.lerp(1, minScale, u);
            const yesScale = pickedYes ? p.lerp(minObj, maxObj, u) : minObj;
            const noScale  = pickedYes ? minObj : p.lerp(minObj, maxObj, u);

            renderObject(obj1, 140, 230, 250, 0.006, bitScale);
            renderObject(obj2, 140, 230, 250, 0.004 + Math.PI, bitScale);
            renderObject(obj3, 254, 175, 75, 0.001, yesScale);
            renderObject(obj4, 255, 100, 40, 0.002, noScale);
        };

        function pickNewTarget() {
            targetX = p.random(-200, 200);
            targetY = p.random(-100, 100);
        }

        function renderObject(obj, r, g, b, offset, scaleValue) {
            const m = p.millis();
            p.push();
            p.translate(currentX * k, currentY * k, 0);
            p.rotateY(0.5 - Math.sin(m * 0.0015));
            p.rotateZ(0.5 - Math.cos(m * 0.0022));
            p.ambientMaterial(r, g, b);
            p.scale((1 + Math.sin(m * 0.006 + offset) * 0.1) * 4 * scaleValue * k);
            p.model(obj);
            p.pop();
        }

        function handleClick() {
            const now = p.millis();
            if (now - lastClickTime < cooldown) return;
            lastClickTime = now;
            p.userStartAudio();

            pickedYes = p.random([true, false]);
            scaling = true;
            scaleStartTime = now;
            const snd = pickedYes ? yesSound : noSound;
            if (!snd.isPlaying()) snd.play();
        }
    }, holder);
})();
