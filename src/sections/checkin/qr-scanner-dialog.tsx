'use client';

import type QrScanner from 'qr-scanner';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { cameraErrorKey } from './checkin-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
};

/**
 * Полноэкранный сканер QR камерой телефона. qr-scanner декодирует в web
 * worker и работает в iOS Safari (где нет BarcodeDetector). Модуль
 * браузерный — грузим динамически, только когда диалог открыт.
 */
export function QrScannerDialog({ open, onClose, onResult }: Props) {
  const { t } = useTranslate('checkin');
  const videoRef = useRef<HTMLVideoElement>(null);
  // i18n-ключ причины, по которой камера не запустилась (null — работает).
  const [cameraError, setCameraError] = useState<string | null>(null);

  // onResult/onClose меняются на каждом рендере родителя — держим актуальные
  // в ref, чтобы не перезапускать камеру.
  const handlers = useRef({ onResult, onClose });
  handlers.current = { onResult, onClose };

  useEffect(() => {
    if (!open) return undefined;
    let scanner: QrScanner | null = null;
    let cancelled = false;
    setCameraError(null);

    (async () => {
      const { default: Scanner } = await import('qr-scanner');
      if (cancelled || !videoRef.current) return;
      scanner = new Scanner(
        videoRef.current,
        (result) => {
          scanner?.stop();
          handlers.current.onResult(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );
      try {
        await scanner.start();
      } catch (error) {
        if (!cancelled) setCameraError(cameraErrorKey(error, window.isSecureContext));
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [open]);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Box
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'common.black',
          color: 'common.white',
        }}
      >
        <Typography variant="subtitle1">{t('desk.scannerTitle')}</Typography>
        {cameraError ? (
          <Typography sx={{ color: 'warning.light' }}>{t(cameraError)}</Typography>
        ) : (
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            sx={{ width: 1, maxWidth: 520, borderRadius: 2 }}
          />
        )}
        <Button variant="contained" color="inherit" onClick={onClose}>
          {t('desk.cancel')}
        </Button>
      </Box>
    </Dialog>
  );
}
