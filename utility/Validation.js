var date_verificaion = async (date) => {
    var today = new Date();
    const d = new Date(date);
    let text = d.toLocaleDateString();
    var date =
        String(today.getMonth() + 1) +
        '/' +
        String(today.getDate()) +
        '/' +
        String(today.getFullYear());
    return { date, text };
};
var format = (time) => {
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;
    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = '';
    if (hrs > 0) {
        ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
    }
    ret += '' + mins + ':' + (secs < 10 ? '0' : '');
    ret += '' + secs;
    return ret;
};
module.exports = {
    date_verificaion,
    format,
};
