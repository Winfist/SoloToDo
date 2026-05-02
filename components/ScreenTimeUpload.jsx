import React, { useState } from 'react';

/**
 * ScreenTimeUpload — standalone version.
 * Uses dynamic import for Tesseract.js to avoid bundle bloat and import errors.
 */
export default function ScreenTimeUpload({ onTimeParsed }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState('');

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setResultText('');

    try {
      // 1. Convert file to URL
      const imageUrl = URL.createObjectURL(file);

      // 2. Dynamic import of Tesseract
      const Tesseract = (await import('tesseract.js')).default;

      // 3. Run Tesseract OCR
      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'deu', // German language
        { logger: m => console.log('[OCR]', m.status, Math.round((m.progress || 0) * 100) + '%') }
      );

      // 4. Parse time patterns: "4h 30m", "4 Std. 30 Min.", "2:45"
      const timeRegex = /(\d+)\s*(h|std\.?|stunden?)\s*(?:(\d+)\s*(m|min\.?|minuten?))?/i;
      const colonRegex = /(\d{1,2}):(\d{2})/;
      let match = text.match(timeRegex);

      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[3] || '0', 10);
        const totalMinutes = (hours * 60) + minutes;

        setResultText(`Gefunden: ${hours}h ${minutes}m (${totalMinutes} Minuten)`);
        if (onTimeParsed) onTimeParsed(totalMinutes);
      } else {
        match = text.match(colonRegex);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const totalMinutes = (hours * 60) + minutes;
          setResultText(`Gefunden: ${hours}h ${minutes}m (${totalMinutes} Minuten)`);
          if (onTimeParsed) onTimeParsed(totalMinutes);
        } else {
          setError('Konnte keine Bildschirmzeit im Bild erkennen. Bitte achte darauf, dass die Dauer gut lesbar ist.');
        }
      }
    } catch (err) {
      console.error('[ScreenTimeUpload]', err);
      setError('Fehler bei der Bildverarbeitung: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', marginTop: '1rem', background: '#111' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>Bildschirmzeit validieren</h3>
      <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '10px' }}>
        Lade einen Screenshot deiner Apple/Android Bildschirmzeit hoch, um deine Quest abzuschließen.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isProcessing}
        style={{ color: '#fff' }}
      />

      {isProcessing && <p style={{ color: '#00ffcc', fontSize: '0.9rem' }}>Bild wird analysiert... Bitte warten.</p>}

      {error && <p style={{ color: '#ff4444', fontSize: '0.9rem' }}>{error}</p>}

      {resultText && (
        <div style={{ marginTop: '10px', color: '#00ffcc', fontWeight: 'bold' }}>
          {resultText}
        </div>
      )}
    </div>
  );
}
