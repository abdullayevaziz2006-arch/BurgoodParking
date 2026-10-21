using System;
using System.IO;
using System.Runtime.InteropServices;

namespace SmartPark {
  class Program {
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
    public class DOCINFO {
      [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
      [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
      [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
    public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);

    [DllImport("winspool.Drv", SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr h);

    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
    public static extern bool StartDocPrinter(IntPtr h, int l, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFO di);

    [DllImport("winspool.Drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr h);

    [DllImport("winspool.Drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr h);

    [DllImport("winspool.Drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr h);

    [DllImport("winspool.Drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr h, IntPtr b, int c, out int w);

    static int Main(string[] args) {
      if (args.Length < 2) return 1;
      string printer = args[0];
      string file = args[1];
      if (!File.Exists(file)) return 2;
      byte[] data = File.ReadAllBytes(file);

      IntPtr h;
      if (!OpenPrinter(printer, out h, IntPtr.Zero)) return 3;
      DOCINFO di = new DOCINFO();
      di.pDocName = "Chek";
      di.pDataType = "RAW";
      bool ok = false;
      if (StartDocPrinter(h, 1, di)) {
        if (StartPagePrinter(h)) {
          IntPtr p = Marshal.AllocCoTaskMem(data.Length);
          Marshal.Copy(data, 0, p, data.Length);
          int w;
          ok = WritePrinter(h, p, data.Length, out w);
          Marshal.FreeCoTaskMem(p);
          EndPagePrinter(h);
        }
        EndDocPrinter(h);
      }
      ClosePrinter(h);
      return ok ? 0 : 4;
    }
  }
}
