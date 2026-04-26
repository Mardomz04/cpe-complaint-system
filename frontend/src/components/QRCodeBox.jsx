import { QRCodeCanvas } from 'qrcode.react';

function QRCodeBox() {
  const complaintLink = 'https://cpe-complaint-system.vercel.app/complaint';

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      background: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      textAlign: 'center'
    }}>
      <p style={{
        fontSize: '13px',
        marginBottom: '10px',
        color: '#000'
      }}>
        Scan to submit complaint
      </p>

      <QRCodeCanvas
        value={complaintLink}
        size={220}              // 🔥 bigger
        bgColor="#ffffff"       // 🔥 pure white
        fgColor="#000000"       // 🔥 pure black
        level="H"               // 🔥 high error correction
        includeMargin={true}    // 🔥 adds spacing (VERY IMPORTANT)
      />
    </div>
  );
}

export default QRCodeBox;
