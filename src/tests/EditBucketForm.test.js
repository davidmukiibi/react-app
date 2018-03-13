import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import EditBucketForm from '../components/forms/EditBucketForm';

describe("EditBucketForm", () => {
    it("Should render", () => {
        let root = shallow(<EditBucketForm />);
        expect(root.find('.o-title').text()).to.contain("Editing ")
    });
});
