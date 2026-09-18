declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; backgroundColor?: string; logging?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: 'portrait' | 'landscape' };
    pagebreak?: { mode?: string[] | string };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement): Html2PdfWorker;
    save(): Promise<void>;
    toPdf(): Html2PdfWorker;
    output(type: string): unknown;
    then(fn: (result: unknown) => void): Html2PdfWorker;
  }

  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}
