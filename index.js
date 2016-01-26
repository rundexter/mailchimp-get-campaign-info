var _ = require('lodash'),
    request = require('request'),
    util = require('./util'),
    querystring = require('querystring'),
    pickInputs = {
        campaign_id: {
            key: 'campaign_id',
            validate: {
                req: true
            }
        },
        fields: {
            key: 'fields',
            type: 'array'
        },
        exclude_fields: {
            key: 'exclude_fields',
            type: 'array'
        }
    },
    pickOutputs = {
        id: 'id',
        type: 'type',
        create_time: 'create_time',
        archive_url: 'archive_url',
        status: 'status',
        emails_sent: 'emails_sent',
        report_summary: 'report_summary',
        _links: '_links'
    };

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var accessToken = dexter.provider('mailchimp').credentials('access_token'),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        if (!dexter.environment('mailchimp_server'))
            return this.fail('A [mailchimp_server] environment need for this module.');

        if (validateErrors)
            return this.fail(validateErrors);

        if (inputs.campaign_id) {
            var newInputs = _.omit(inputs, 'campaign_id');
        }

        if (newInputs.fields)
            newInputs.fields = _.map(newInputs.fields, function(value) {return value.trim()}).join();

        if (newInputs.exclude_fields)
            newInputs.exclude_fields = _.map(newInputs.exclude_fields, function(value) {return value.trim()}).join();

        var queryParams = querystring.stringify(newInputs),
            uri = queryParams ? 'campaigns/' + inputs.campaign_id + '?' + queryParams : 'campaigns/' + inputs.campaign_id,
            baseUrl = 'https://' + dexter.environment('mailchimp_server') + '.api.mailchimp.com/3.0/';

        request({
            baseUrl: baseUrl,
            method: 'GET',
            uri: uri,
            json: true,
            auth : { bearer: accessToken }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                this.complete(util.pickOutputs(body, pickOutputs));
            } else {
                this.fail(error || body);
            }
        }.bind(this));
    }
};
