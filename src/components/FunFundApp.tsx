"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export default function FunFundApp() {
  const [activeTab, setActiveTab] = useState<"proposals" | "evaluate" | "wallet">("proposals");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">FunFund</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Crowdfunding with Weighted Evaluation</p>
        </div>
      </header>
      
      <nav className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("proposals")}
              className={`px-4 py-3 font-medium ${
                activeTab === "proposals"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Proposals & Rankings
            </button>
            <button
              onClick={() => setActiveTab("evaluate")}
              className={`px-4 py-3 font-medium ${
                activeTab === "evaluate"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create & Evaluate
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-3 font-medium ${
                activeTab === "wallet"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Wallet & Contribute
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "proposals" && <ProposalsRanking />}
        {activeTab === "evaluate" && <CreateAndEvaluate />}
        {activeTab === "wallet" && <WalletAndContribute />}
      </main>
    </div>
  );
}

function ProposalsRanking() {
  const rankedProposals = useQuery(api.evaluations.getProposalsRankedByScore);

  if (!rankedProposals) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Proposals Ranked by Score</h2>
      
      {rankedProposals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">No active proposals yet. Create one in the Create & Evaluate tab!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rankedProposals.map((proposal, index) => (
            <ProposalCard key={proposal._id} proposal={proposal} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, rank }: { proposal: { _id: Id<"proposals">; title: string; description: string; averageScore: number | null; evaluationCount: number }; rank: number }) {
  const scoreDetails = useQuery(api.evaluations.getProposalAverageScore, { proposalId: proposal._id });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : rank === 3 ? "bg-amber-600" : "bg-gray-300"
          }`}>
            {rank}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{proposal.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{proposal.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-indigo-600">
            {proposal.averageScore !== null ? proposal.averageScore.toFixed(2) : "N/A"}
          </div>
          <div className="text-sm text-gray-500">{proposal.evaluationCount} evaluations</div>
        </div>
      </div>
      
      {scoreDetails?.breakdown && (
        <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-2 text-center text-sm">
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Innovation</div>
            <div className="text-indigo-600">{scoreDetails.breakdown.innovation.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Feasibility</div>
            <div className="text-indigo-600">{scoreDetails.breakdown.feasibility.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Impact</div>
            <div className="text-indigo-600">{scoreDetails.breakdown.impact.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Team</div>
            <div className="text-indigo-600">{scoreDetails.breakdown.team.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Presentation</div>
            <div className="text-indigo-600">{scoreDetails.breakdown.presentation.toFixed(1)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAndEvaluate() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <CreateTestData />
      <EvaluateProposal />
    </div>
  );
}

function CreateTestData() {
  const [status, setStatus] = useState<string>("");
  const createProfile = useMutation(api.profiles.create);
  const createProposal = useMutation(api.proposals.create);
  const updateProposal = useMutation(api.proposals.update);
  const profiles = useQuery(api.profiles.list);
  const activeProposals = useQuery(api.proposals.listActive);

  const handleCreateTestProfile = async () => {
    try {
      const profileId = await createProfile({
        userId: `test-user-${Date.now()}`,
        username: `testuser${Date.now()}`,
        fullName: "Test User",
        email: "test@example.com",
      });
      setStatus(`Profile created: ${profileId}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleCreateTestProposal = async () => {
    if (!profiles || profiles.length === 0) {
      setStatus("Please create a profile first!");
      return;
    }
    try {
      const proposalId = await createProposal({
        authorId: profiles[0]._id,
        title: `Innovative Project ${Date.now()}`,
        description: "A revolutionary project that will change the world with cutting-edge technology and sustainable practices.",
        goalAmount: 100000,
        category: "Technology",
      });
      
      await updateProposal({
        id: proposalId,
        status: "active",
      });
      
      setStatus(`Proposal created and activated: ${proposalId}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create Test Data</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Profiles: {profiles?.length ?? 0}
          </p>
          <button
            onClick={handleCreateTestProfile}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Test Profile
          </button>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Active Proposals: {activeProposals?.length ?? 0}
          </p>
          <button
            onClick={handleCreateTestProposal}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Create Test Proposal
          </button>
        </div>
        
        {status && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

function EvaluateProposal() {
  const profiles = useQuery(api.profiles.list);
  const activeProposals = useQuery(api.proposals.listActive);
  const createEvaluation = useMutation(api.evaluations.create);
  
  const [selectedProposal, setSelectedProposal] = useState<string>("");
  const [scores, setScores] = useState({
    innovation: 3,
    feasibility: 3,
    impact: 3,
    team: 3,
    presentation: 3,
  });
  const [weights, setWeights] = useState({
    innovation: 0.2,
    feasibility: 0.2,
    impact: 0.2,
    team: 0.2,
    presentation: 0.2,
  });
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string>("");

  const calculateWeightedScore = () => {
    return (
      scores.innovation * weights.innovation +
      scores.feasibility * weights.feasibility +
      scores.impact * weights.impact +
      scores.team * weights.team +
      scores.presentation * weights.presentation
    ).toFixed(2);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedProposal || !profiles || profiles.length === 0) {
      setStatus("Please select a proposal and ensure a profile exists!");
      return;
    }

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setStatus(`Weights must sum to 1.0 (current: ${totalWeight.toFixed(2)})`);
      return;
    }

    try {
      await createEvaluation({
        proposalId: selectedProposal as Id<"proposals">,
        evaluatorId: profiles[0]._id,
        innovationScore: scores.innovation,
        feasibilityScore: scores.feasibility,
        impactScore: scores.impact,
        teamScore: scores.team,
        presentationScore: scores.presentation,
        innovationWeight: weights.innovation,
        feasibilityWeight: weights.feasibility,
        impactWeight: weights.impact,
        teamWeight: weights.team,
        presentationWeight: weights.presentation,
        comment: comment || undefined,
      });
      setStatus("Evaluation submitted successfully! Check the Rankings tab.");
      setComment("");
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const criteria = [
    { key: "innovation", label: "Innovation" },
    { key: "feasibility", label: "Feasibility" },
    { key: "impact", label: "Impact" },
    { key: "team", label: "Team" },
    { key: "presentation", label: "Presentation" },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Evaluate Proposal</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Proposal
          </label>
          <select
            value={selectedProposal}
            onChange={(e) => setSelectedProposal(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- Select --</option>
            {activeProposals?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {criteria.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 gap-2 items-center">
              <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Score:</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={scores[key]}
                  onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-6 text-center font-medium">{scores[key]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Weight:</span>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weights[key]}
                  onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                  className="w-16 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Weighted Score Preview:</div>
          <div className="text-2xl font-bold text-indigo-600">{calculateWeightedScore()}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            rows={2}
          />
        </div>

        <button
          onClick={handleSubmitEvaluation}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
        >
          Submit Evaluation
        </button>

        {status && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

function WalletAndContribute() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <WalletSection />
      <ContributeSection />
    </div>
  );
}

function WalletSection() {
  const profiles = useQuery(api.profiles.list);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [walletStatus, setWalletStatus] = useState<string>("");
  
  const deposit = useMutation(api.transactions.deposit);
  const createProfile = useMutation(api.profiles.create);
  
  const selectedProfile = profiles?.find(p => p._id === selectedProfileId);
  const transactions = useQuery(
    api.transactions.getTransactionHistory,
    selectedProfileId ? { profileId: selectedProfileId as Id<"profiles">, limit: 10 } : "skip"
  );

  const handleCreateProfileWithBalance = async () => {
    try {
      const profileId = await createProfile({
        userId: `wallet-user-${Date.now()}`,
        username: `walletuser${Date.now()}`,
        fullName: "Wallet Test User",
        email: "wallet@example.com",
        initialBalance: 10000,
      });
      setSelectedProfileId(profileId);
      setWalletStatus(`Profile created with 10,000 initial balance: ${profileId}`);
    } catch (error) {
      setWalletStatus(`Error: ${error}`);
    }
  };

  const handleDeposit = async () => {
    if (!selectedProfileId) {
      setWalletStatus("Please select a profile first!");
      return;
    }
    try {
      const result = await deposit({
        profileId: selectedProfileId as Id<"profiles">,
        amount: depositAmount,
        description: "Manual deposit",
      });
      setWalletStatus(`Deposited ${depositAmount}. New balance: ${result.balanceAfter}`);
    } catch (error) {
      setWalletStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Virtual Wallet</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Profile
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- Select Profile --</option>
            {profiles?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.username || p.fullName || p.userId} (Balance: {p.balance ?? 0})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateProfileWithBalance}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
        >
          Create Profile with 10,000 Balance
        </button>

        {selectedProfile && (
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
            <div className="text-sm opacity-80">Current Balance</div>
            <div className="text-3xl font-bold">{(selectedProfile.balance ?? 0).toLocaleString()}</div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Amount"
          />
          <button
            onClick={handleDeposit}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Deposit
          </button>
        </div>

        {transactions && transactions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Transactions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx._id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm flex justify-between">
                  <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {tx.type}: {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                  </span>
                  <span className="text-gray-500">Balance: {tx.balanceAfter.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {walletStatus && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            {walletStatus}
          </div>
        )}
      </div>
    </div>
  );
}

function ContributeSection() {
  const profiles = useQuery(api.profiles.list);
  const activeProposals = useQuery(api.proposals.listActive);
  const contribute = useMutation(api.transactions.contribute);
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [contributionAmount, setContributionAmount] = useState<number>(1000);
  const [contributeStatus, setContributeStatus] = useState<string>("");

  const selectedProfile = profiles?.find(p => p._id === selectedProfileId);
  const selectedProposal = activeProposals?.find(p => p._id === selectedProposalId);

  const handleContribute = async () => {
    if (!selectedProfileId || !selectedProposalId) {
      setContributeStatus("Please select both a profile and a proposal!");
      return;
    }
    
    if (selectedProfile && (selectedProfile.balance ?? 0) < contributionAmount) {
      setContributeStatus("Insufficient balance! Please deposit more funds.");
      return;
    }

    try {
      const result = await contribute({
        profileId: selectedProfileId as Id<"profiles">,
        proposalId: selectedProposalId as Id<"proposals">,
        amount: contributionAmount,
      });
      setContributeStatus(`Contributed ${contributionAmount} to proposal! New balance: ${result.balanceAfter}, Proposal total: ${result.newProposalAmount}`);
    } catch (error) {
      setContributeStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Contribute to Proposal</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Your Profile
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- Select Profile --</option>
            {profiles?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.username || p.fullName || p.userId} (Balance: {p.balance ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Proposal to Support
          </label>
          <select
            value={selectedProposalId}
            onChange={(e) => setSelectedProposalId(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- Select Proposal --</option>
            {activeProposals?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} (Goal: {p.goalAmount.toLocaleString()}, Current: {p.currentAmount.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {selectedProposal && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white">{selectedProposal.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedProposal.description}</p>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{((selectedProposal.currentAmount / selectedProposal.goalAmount) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((selectedProposal.currentAmount / selectedProposal.goalAmount) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{selectedProposal.currentAmount.toLocaleString()}</span>
                <span>{selectedProposal.goalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contribution Amount
          </label>
          <input
            type="number"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(Number(e.target.value))}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Amount to contribute"
          />
          {selectedProfile && (
            <p className="text-xs text-gray-500 mt-1">
              Your balance: {(selectedProfile.balance ?? 0).toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={handleContribute}
          disabled={!selectedProfileId || !selectedProposalId || contributionAmount <= 0}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Contribute {contributionAmount.toLocaleString()}
        </button>

        {contributeStatus && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            {contributeStatus}
          </div>
        )}
      </div>
    </div>
  );
}
