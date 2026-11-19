import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function recordId(value: unknown) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid activity');
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (!recordId(userId) || !recordId(teamId)) throw httpError(400, 'A valid userId and teamId are required');
  if (typeof type !== 'string' || type.trim().length === 0) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Minutes must be a positive number');
  }
  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid team');
  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || mascot.trim().length === 0) throw httpError(400, 'Team mascot is required');

  const suppliedMembers = members === undefined ? [] : members;
  if (!Array.isArray(suppliedMembers) || suppliedMembers.some((id) => !recordId(id))) {
    throw httpError(400, 'Team members must be valid user IDs');
  }
  const memberIds = [...new Set(suppliedMembers)];
  if (memberIds.length > 0) {
    const count = await User.countDocuments({ _id: { $in: memberIds } });
    if (count !== memberIds.length) throw httpError(404, 'One or more team members were not found');
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .filter((entry) => entry.teamName !== 'Unknown team')
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(_userEmail: string) {
  const userEmail = _userEmail.trim().toLowerCase();
  if (!userEmail) throw httpError(400, 'User email is required');
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = recentActivity?.type?.trim().toLowerCase();
  const typeFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const focus = activityType ? typeFocus[activityType] ?? user.fitnessGoal : user.fitnessGoal;
  const workouts = await Workout.find({}).lean();
  const matching = workouts.filter((workout) => workout.focus.toLowerCase() === focus.toLowerCase());
  const fallback = matching.length > 0 ? matching : workouts;
  return fallback.map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Based on your recent ${recentActivity.type} activity and ${focus} goal`
      : `Matches your ${focus} fitness goal`,
  }));
}

export { User };
