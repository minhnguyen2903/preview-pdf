/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import pdfjs from "pdfjs-dist/build/pdf";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker";

pdfjs.GlobalWorkerOptions.workerSrc =
  "../../node_modules/pdfjs-dist/build/pdf.worker";

function PDFViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const pdfPath = "../assets/Building microfontends.pdf"; // Replace with the path to your PDF file

    if (canvasRef.current) {
      pdfjs
        .getDocument(pdfPath)
        .promise.then((pdf: { getPage: (arg0: number) => Promise<any> }) => {
          pdf
            .getPage(1)
            .then(
              (page: {
                getViewport: (arg0: { scale: number }) => any;
                render: (arg0: { canvasContext: any; viewport: any }) => void;
              }) => {
                const canvas: any = canvasRef.current;
                const context = canvas.getContext("2d");

                const viewport = page.getViewport({ scale: 1.0 });

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                page.render({ canvasContext: context, viewport: viewport });
              }
            );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default PDFViewer;
