# ocr_morsaa
Servicio de OCR para sistema morsaa mediante tesseract e imagemagick


## Variables de entorno

### ImageMagick
Establecer en el servidor la variable de entorno `MAGICK_TMPDIR` con la ruta a la carpeta donde ImageMagick creará los archivos temporales necesarios para el proceso.

```
MAGICK_TMPDIR=path/to/temp/imagemagick/files
```

### TIMEOUT
Establecer en el archivo .env el número máximo de milisegundos que se desea esperar para el procesado de cada documento PDF.
```
TIMEOUT=3600000
```