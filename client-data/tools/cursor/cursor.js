/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2020  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function () { // Code isolation

    // Allocate half of the maximum server updates to cursor updates
    var MIN_CURSOR_UPDATES_INTERVAL_MS = Tools.server_config.MAX_EMIT_COUNT_PERIOD / Tools.server_config.MAX_EMIT_COUNT * 2;

    var CURSOR_DELETE_AFTER_MS = 1000 * 3600;

    var lastCursorUpdate = 0;
    var sending = true;

    var cursorTool = {
        "name": "Cursor",
        "listeners": {
            "press": function () { sending = false },
            "move": handleMarker,
            "release": function () { sending = true },
        },
        "onSizeChange": onSizeChange,
        "draw": draw,
        "mouseCursor": "crosshair",
        "icon": "tools/pencil/icon.svg",
    };
    Tools.register(cursorTool);
    Tools.addToolListeners(cursorTool);

    var message = {
        type: "update",
        x: 0,
        y: 0,
        color: Tools.getColor(),
        size: Tools.getSize(),
    };

    function handleMarker(x, y) {
        // throttle local cursor updates
        message.x = x;
        message.y = y;
        message.color = Tools.getColor();
        message.size = Tools.getSize();
        updateMarker();
    }

    function onSizeChange(size) {
        message.size = size;
        updateMarker();
    }

    function updateMarker() {
        if (!Tools.showMarker || !Tools.showMyCursor) return;
        var cur_time = Date.now();
        if (cur_time - lastCursorUpdate > MIN_CURSOR_UPDATES_INTERVAL_MS &&
            (sending || Tools.curTool.showMarker)) {
            Tools.drawAndSend(message, cursorTool);
            lastCursorUpdate = cur_time;
        }
    }

    var cursorsElem = Tools.svg.getElementById("cursors");

    function createCursor(id) {
        var cursor = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        cursor.setAttributeNS(null, "class", "opcursor");
        cursor.setAttributeNS(null, "id", id);
        cursor.setAttributeNS(null, "cx", 0);
        cursor.setAttributeNS(null, "cy", 0);
        cursor.setAttributeNS(null, "r", 10);
        cursorsElem.appendChild(cursor);
        setTimeout(function () {
            cursorsElem.removeChild(cursor);
        }, CURSOR_DELETE_AFTER_MS);
        return cursor;
    }

    function getCursor(id) {
        return document.getElementById(id) || createCursor(id);
    }
    var dummyDot = null;

    function bounds(el) {
        let rect = el.getBoundingClientRect();
        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        rect = dummyDot.getBoundingClientRect();
        const dotSize = (rect.right - rect.left);
        const wh = (window.innerHeight || document.documentElement.clientHeight);
        const ww = (window.innerWidth || document.documentElement.clientWidth);
        return {cx, cy, wh, ww, dotSize, wmin: Math.min(wh, ww)};
    }

    function draw(message) {
        if (!dummyDot) {
            dummyDot = getCursor('cursor-dymmyDot');
            dummyDot.setAttributeNS(null, "r", "0.5"); // So r-l=1
            dummyDot.setAttributeNS(null, "fill-opacity", "0.001");
        }
        var cursor = getCursor("cursor-" + (message.socket || 'me'));
        cursor.style.transform = "translate(" + message.x + "px, " + message.y + "px)";
        if (Tools.isIE) cursor.setAttributeNS(null, "transform", "translate(" + message.x + " " + message.y + ")");
        cursor.setAttributeNS(null, "fill", message.color);

        if (message.socket) {
            const bnd = bounds(cursor);
            const useR = 0.025 * (bnd.wmin / bnd.dotSize);
            cursor.setAttributeNS(null, "r", useR.toString());
            cursor.setAttributeNS(null, "fill-opacity", "0.25");
            // let dx = 0;
            // let dy = 0;
            // if (bnd.cx < 0) dx = -bnd.cx;
            // else if (bnd.cx > bnd.ww) dx = bnd.ww - bnd.cx;
            // if (bnd.cy < 0) dy = -bnd.cy;
            // else if (bnd.cy > bnd.wh) dy = bnd.wh - bnd.cy;
            // if (dx !== 0 || dy !== 0) {
            //     // Нужно сдвинуть (useX, useY) на (dx, dy), вот только в масштабе
            //     const canvRect = document.getElementById('canvas').getBoundingClientRect();
            //     console.log({canvRect, message, bnd});
            //     const canvWid = canvRect.right - canvRect.left;
            //     const useX = message.x + dx * canvWid / bnd.ww;
            //     const useY = message.y + dy * canvWid / bnd.ww;
            //     cursor.style.transform = "translate(" + useX + "px, " + useY + "px)";
            //     if (Tools.isIE) cursor.setAttributeNS(null, "transform", "translate(" + useX + " " + useY + ")");
            // }
        } else {
            cursor.setAttributeNS(null, "r", message.size / 2);
        }
    }
})();
