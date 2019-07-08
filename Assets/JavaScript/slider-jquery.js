var rangeSlider = function () {
    var slider = $('.range-slider'),
        range = $('.range-slider_range'),
        value = $('.range-slider_value');
        console.log(value); 

    slider.each(function () {

        value.each(function () {
            var value = $(this).prev().attr('value');
            $(this).html(value);
        });

        range.on('input', function () {
            $(this).next(value).html(this.value);
            // if(this.attr('id')=='tmr'){
            //     var secs = (this.value/100) * song.duration
            //     $(this).next(value) =  
            // }
        });
    });
};

// rangeSlider();