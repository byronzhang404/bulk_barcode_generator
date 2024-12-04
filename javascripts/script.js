var defaultValues = {
    CODE128 : "Example 1234",
    CODE128A : "EXAMPLE",
    CODE128B : "Example text",
    CODE128C : "12345678",
    EAN13 : "1234567890128",
    EAN8 : "12345670",
    UPC : "123456789999",
    CODE39 : "EXAMPLE TEXT",
    ITF14 : "10012345000017",
    ITF : "123456",
    MSI : "123456",
    MSI10 : "123456",
    MSI11 : "123456",
    MSI1010 : "123456",
    MSI1110 : "123456",
    pharmacode : "1234"
};

$(document).ready(function(){
    $("#userInput").on('input',newBarcode);
    $("#barcodeType").change(function(){
        $("#userInput").val( defaultValues[$(this).val()] );

        newBarcode();
    });

    $(".text-align").click(function(){
      $(".text-align").removeClass("btn-primary");
      $(this).addClass("btn-primary");

      newBarcode();
    });

    $(".font-option").click(function(){
      if($(this).hasClass("btn-primary")){
        $(this).removeClass("btn-primary");
      }
      else{
        $(this).addClass("btn-primary");
      }

      newBarcode();
    });

    $(".display-text").click(function(){
      $(".display-text").removeClass("btn-primary");
      $(this).addClass("btn-primary");

      if($(this).val() == "true"){
        $("#font-options").slideDown("fast");
      }
      else{
        $("#font-options").slideUp("fast");
      }

      newBarcode();
    });

    $("#font").change(function(){
      $(this).css({"font-family": $(this).val()});
      newBarcode();
    });

    $('input[type="range"]').rangeslider({
        polyfill: false,
        rangeClass: 'rangeslider',
        fillClass: 'rangeslider__fill',
        handleClass: 'rangeslider__handle',
        onSlide: newBarcode,
        onSlideEnd: newBarcode
    });

    $('.color').colorPicker({renderCallback: newBarcode});

    // Add download button handler
    $("#download-btn").click(handleDownload);
    
    newBarcode();
});

var newBarcode = function() {
    // Clear previous barcodes
    $("#barcodes").empty();
    
    // Get input lines
    var lines = $("#userInput").val().split('\n');
    
    // Hide download controls if no valid input
    if (lines.filter(line => line.trim() !== '').length === 0) {
        $("#download-controls").hide();
        return;
    }
    
    // Generate barcode for each line
    lines.forEach(function(line, index) {
        if(line.trim() === '') return; // Skip empty lines
        
        // Create SVG element for this barcode
        var svgElement = $('<svg class="barcode"></svg>');
        $("#barcodes").append(svgElement);
        
        // Generate barcode
        svgElement.JsBarcode(
            line.trim(),
            {
                "format": $("#barcodeType").val(),
                "background": $("#background-color").val(),
                "lineColor": $("#line-color").val(),
                "fontSize": parseInt($("#bar-fontSize").val()),
                "height": parseInt($("#bar-height").val()),
                "width": $("#bar-width").val(),
                "margin": parseInt($("#bar-margin").val()),
                "textMargin": parseInt($("#bar-text-margin").val()),
                "displayValue": $(".display-text.btn-primary").val() == "true",
                "font": $("#font").val(),
                "fontOptions": $(".font-option.btn-primary").map(function(){return this.value;}).get().join(" "),
                "textAlign": $(".text-align.btn-primary").val(),
                "valid":
                    function(valid){
                        if(valid){
                            svgElement.show();
                            $("#invalid").hide();
                        }
                        else{
                            svgElement.hide();
                            $("#invalid").show();
                        }
                    }
            });
    });

    $("#bar-width-display").text($("#bar-width").val());
    $("#bar-height-display").text($("#bar-height").val());
    $("#bar-fontSize-display").text($("#bar-fontSize").val());
    $("#bar-margin-display").text($("#bar-margin").val());
    $("#bar-text-margin-display").text($("#bar-text-margin").val());
    
    // Show download controls if we have valid barcodes
    $("#download-controls").show();
};

// Add download handling function
function handleDownload() {
    const format = $("#download-format").val();
    const barcodes = $("#barcodes").children();
    
    // If only one barcode, download directly
    if (barcodes.length === 1) {
        downloadBarcode(barcodes[0], format, 1);
        return;
    }
    
    // For multiple barcodes, create a zip file
    const zip = new JSZip();
    
    // Convert each barcode and add to zip
    const promises = Array.from(barcodes).map((barcode, index) => {
        return new Promise(resolve => {
            if (format === 'svg') {
                // For SVG, just get the source
                const svgData = new XMLSerializer().serializeToString(barcode);
                zip.file(`barcode-${index + 1}.svg`, svgData);
                resolve();
            } else {
                // For PNG/JPG, convert SVG to image
                const svgData = new XMLSerializer().serializeToString(barcode);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(blob => {
                        zip.file(`barcode-${index + 1}.${format}`, blob);
                        resolve();
                    }, `image/${format}`);
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            }
        });
    });
    
    // Generate and download zip file
    Promise.all(promises).then(() => {
        zip.generateAsync({type: 'blob'}).then(content => {
            saveAs(content, 'barcodes.zip');
        });
    });
}

function downloadBarcode(svgElement, format, index) {
    if (format === 'svg') {
        // Download as SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], {type: 'image/svg+xml'});
        saveAs(blob, `barcode-${index}.svg`);
    } else {
        // Download as PNG/JPG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
                saveAs(blob, `barcode-${index}.${format}`);
            }, `image/${format}`);
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
}