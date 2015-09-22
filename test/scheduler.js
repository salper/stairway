import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {scheduleAndRun} from '../lib/scheduler';

chai.use(sinonChai);

describe('scheduler', () => {
  describe('given single node', () => {
    let node;

    beforeEach(() =>
      node = {
        level: 1,
        active: true,
        children: [],
        updateState: sinon.spy(next => next())
      });

    it('should update node', () => {
      scheduleAndRun(node);
      expect(node.updateState).to.have.been.calledOnce;
      expect(node.updateState).to.have.been.calledWith(sinon.match.func);
    });

    it('should not allow cascading update', () => {
      node.updateState = () => scheduleAndRun(node);
      expect(scheduleAndRun.bind(null, node)).to.throw(
        'Scheduler is running, avoid cascading updates');
    });

    it('should not update inactive node', () => {
      node.active = false;
      scheduleAndRun(node);
      expect(node.updateState).to.not.have.been.called;
    });
  });

  describe('given single node', () => {
    let nodes;

    beforeEach(() => {
      const createNode = props => Object.assign({
        level: 1,
        active: true,
        children: [],
        updateState: sinon.spy(next => next())
      }, props);

      nodes = {};
      nodes.nodeA = createNode({});
      nodes.nodeB = createNode({level: 2});
      nodes.nodeC = createNode({level: 3});
      nodes.nodeD = createNode({level: 3});
      nodes.nodeE = createNode({level: 4});
      nodes.nodeF = createNode({level: 5});
      nodes.nodeG = createNode({level: 2});
      nodes.nodeH = createNode({level: 6});

      nodes.nodeA.children.push(nodes.nodeB, nodes.nodeG);
      nodes.nodeB.children.push(nodes.nodeC, nodes.nodeD);
      nodes.nodeC.children.push(nodes.nodeE);
      nodes.nodeD.children.push(nodes.nodeF);
      nodes.nodeE.children.push(nodes.nodeF);
      nodes.nodeF.children.push(nodes.nodeH);
      nodes.nodeG.children.push(nodes.nodeH);
    });

    it('should update each node once', () => {
      scheduleAndRun(nodes.nodeA);
      Object.keys(nodes).forEach(name =>
          expect(nodes[name].updateState).to.have.been.calledOnce);
    });

    it('should update nodes in order', () => {
      scheduleAndRun(nodes.nodeA);
      expect(nodes.nodeA.updateState)
        .to.have.been.calledBefore(nodes.nodeB.updateState);
      expect(nodes.nodeA.updateState)
        .to.have.been.calledBefore(nodes.nodeG.updateState);
      expect(nodes.nodeB.updateState)
        .to.have.been.calledBefore(nodes.nodeC.updateState);
      expect(nodes.nodeB.updateState)
        .to.have.been.calledBefore(nodes.nodeD.updateState);
      expect(nodes.nodeC.updateState)
        .to.have.been.calledBefore(nodes.nodeE.updateState);
      expect(nodes.nodeE.updateState)
        .to.have.been.calledBefore(nodes.nodeF.updateState);
      expect(nodes.nodeD.updateState)
        .to.have.been.calledBefore(nodes.nodeF.updateState);
      expect(nodes.nodeF.updateState)
        .to.have.been.calledBefore(nodes.nodeH.updateState);
      expect(nodes.nodeG.updateState)
        .to.have.been.calledBefore(nodes.nodeH.updateState);
    });
  });
});
