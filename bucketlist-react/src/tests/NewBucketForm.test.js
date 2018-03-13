import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import NewBucketForm from '../components/forms/NewBucketForm';

describe("NewBucketForm", () => {
    it("Should render", () => {
        let root = shallow(<NewBucketForm />);
        expect(root.find('.o-title').text()).to.equal("Create a new bucket")
    });
});
