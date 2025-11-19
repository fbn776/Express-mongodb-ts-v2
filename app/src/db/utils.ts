export const timezoneField = {
    type: String,
    default: 'UTC',
    required: true,
    validate: {
        validator: function(value: any) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: value });
                return true;
            } catch (err) {
                return false;
            }
        },
        message: (props: { value: any; }) => `${props.value} is not a valid IANA timezone identifier`
    }
};
