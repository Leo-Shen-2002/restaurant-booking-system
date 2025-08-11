test("main mounts without throwing", async () => {
  document.body.innerHTML = '<div id="root"></div>';
  await import("../../main.jsx");
});