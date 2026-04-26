import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function QRCodeBox() {
  const [show, setShow] = useState(false);

  const complaintLink = 'https://cpe-complaint-system.vercel.app/complaint';

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 999
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Small floating button */}
      <div
        style={{
          background: '#4f46e5',
          color: '#fff',
          padding: '12px 14px',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}
      >
        QR
      </div>

      {/* Hover popup */}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            background: '#fff',
            padding: '12px',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '12px', marginBottom: '8px', color: '#000' }}>
            Scan to submit
          </p>

          <QRCodeCanvas
            value={complaintLink}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={true}
          />
        </div>
      )}
    </div>
  );
}

export default QRCodeBox;
