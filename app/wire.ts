export type WireMessage = StateMessage | ActionEnvelopeMessage | SetupMessage;
export type WireMessageArguments = SetupArguments | StateMessageArguments | ActionMessage[];

export interface WireMessageBase {
    type: string;
    sequence: number;
    arguments: WireMessageArguments;
}

export const Costs = {
    "moves":{
        "move":3,
        "hold":1,
        "shield":2,
        "scan":9,
        "shoot":[3,30,69]
    },
    "income":9,
}

export interface SetupArguments {
    robots: RobotData[];
    code: string;
    gridSize: Point;
    costs : typeof Costs;
}

export const Health = 20;

// @type: "setup"
export interface SetupMessage extends WireMessageBase {
    arguments: SetupArguments;
}

// @type: "state"
export interface StateMessage extends WireMessageBase {
    arguments: StateMessageArguments;
}

export interface StateMessageArguments {
    robot_state: RobotState;
    tick_info: TickData[]
}

export interface RobotState extends RobotData {
    health: number;
    energy: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface TickData {
    in_view: ViewData;
    observations: Observation[];
    action_result: ActionResult;
}

export type ActionResult = HoldResult | MoveResult | ShootResult | ShieldResult | ScanResult;

export interface ActionResultBase {
    type: string;
}

export interface SuccessResult extends ActionResultBase {
    success: boolean;
}

// @type: "hold"
export interface HoldResult extends SuccessResult {
}

export enum ObstacleType {
    Robot,
    Wall
}

// @type: "move"
export interface MoveResult extends SuccessResult {
    obstacle?: ObstacleType;
}

// @type: "shoot"
export interface ShootResult extends SuccessResult {
    robots_hit: RobotId[]
}

// @type: "shield"
export interface ShieldResult extends SuccessResult {
}

// @type: "scan"
export interface ScanResult extends SuccessResult {
    robots: RobotState[];
}

export interface ViewData {
    robots: RobotData[];
    regens: RegenData[];
}

export type RobotId = string;

export interface RobotData {
    name: RobotId;
    location: Point;
}

export interface RegenData {
    location: Point;
    value: number;
}

export type Observation = ShotObservation | ExplosionObservation | ShieldObservation;

export interface BaseObservation {
    type: string;
}

// @type: "shot"
export interface ShotObservation extends BaseObservation {
    location: Point;
}

// @type: "explosion"
export interface ExplosionObservation extends BaseObservation {
    location: Point;
    radius: number;
}

// @type: "shield"
export interface ShieldObservation extends BaseObservation {
    location: Point;
}

// @type: "action"
export interface ActionEnvelopeMessage extends WireMessageBase {
    arguments: ActionMessage[];
}

export type ActionMessage = HoldActionMessage | MoveActionMessage | ShootActionMessage | ShieldActionMessage | ScanActionMessage;

export interface ActionMessageBase {
    command: string;
}

export type ActionArguments = MoveActionArguments | ShootActionArguments | ShieldActionArguments;

export enum CardinalDirection {
    North,
    East,
    South,
    West
}

export interface MoveActionArguments {
    direction: CardinalDirection;
}

export interface ShootActionArguments {
    radius: number;
    location: Point;
}

export interface ShieldActionArguments {
    strength: number;
}

// @command: "move"
export interface MoveActionMessage extends ActionMessageBase {
    arguments: MoveActionArguments;
}

// @command: "hold"
export interface HoldActionMessage extends ActionMessageBase {
}

// @command: "shoot"
export interface ShootActionMessage extends ActionMessageBase {
    arguments: ShootActionArguments;
}

// @command: "shield"
export interface ShieldActionMessage extends ActionMessageBase {
    arguments: ShieldActionArguments;
}

// @command: "scan"
export interface ScanActionMessage extends ActionMessageBase {
}
