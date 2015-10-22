Template.list_emails.helpers({
    result: function () {

        console.log('1', Emails_DB.find().fetch());
        return  Emails_DB.find({});
    }
});
