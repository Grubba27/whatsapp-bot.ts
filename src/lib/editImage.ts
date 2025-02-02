import Jimp from "jimp";

const base64Text = "data:image/png;base64,";

const calcResizingDimensions = (x: number, y: number) => {
  const baseDimension = 700;

  if (x < y){
    const newY = baseDimension;
    const newX = x / y * newY;
    return [newX, newY];
  }
  else {
    const newX = baseDimension;
    const newY = y / x * newX;
    return [newX, newY];
  }
}

const setup = async (img: string) => {
  if (img.includes(base64Text)) img = img.replace(base64Text, "");
  const image = await Jimp.read(Buffer.from(img, "base64"));
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const x = image.getWidth();
  const y = image.getHeight();
  await image.writeAsync("temp.png");
  const tempFile = await Jimp.read("temp.png");
  const [newX, newY] = calcResizingDimensions(x, y);

  return {
    x: newX,
    y: newY,
    font,
    tempFile,
  };
};



export async function addTextToImage(
  img: string,
  text: string,
  isWatermark = false
): Promise<string> {
  const { x, y, font, tempFile } = await setup(img);
  const markImg = (image: Jimp) =>
    isWatermark
    ? image.print(font, 0, 0, text)
    : image.print(font, 0, 0, {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
    },
    x, y);
  
  const imgText: Jimp = await new Promise(
    (resolve, reject) =>
      new Jimp(x, y, "#00000000", (err, image) => {
        markImg(image);
        if (err) reject(err);
        else resolve(image);
      })
  );

  tempFile
  .resize(x, y)
  .composite(imgText, 0, 0, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacityDest: 1,
    opacitySource: isWatermark ? 0.5 : 1,
  });

  const r = await tempFile.getBase64Async(Jimp.MIME_PNG);
  return r.replace(base64Text, "");
}
