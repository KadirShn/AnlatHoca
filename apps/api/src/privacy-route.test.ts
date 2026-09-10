import assert from "node:assert/strict";
import { describe, it } from "node:test";

import app from "./index";

describe("GET /privacy", () => {
  it("returns the public Turkish policy without requiring bindings", async () => {
    const response = await app.request("http://localhost/privacy");
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/i);
    assert.match(response.headers.get("content-type") ?? "", /charset=UTF-8/i);
    assert.match(html, /<html lang="tr">/);
    assert.match(html, /Gemini hizmetine gönderilir/);
    assert.match(html, /topluca silme özelliği bulunmaz/);
    assert.doesNotMatch(html, /<script/i);
  });
});
