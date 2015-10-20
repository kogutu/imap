Template.list_emails.helpers({
    result: function () {
        console.log('1', Chartdata.find().fetch());
        return  Chartdata.find({});
    }
});
