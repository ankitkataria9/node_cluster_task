import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Button, TextField } from '@material-ui/core';

const useStyles = makeStyles({
    table: {
        // minWidth: 650,
    },
});

function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
}

export default function DashboardTable(props) {
    const classes = useStyles();

    function handleChange(e, jobName, oldPriority) {
        const newPriority = e.target.value
        if (!newPriority) return;
        props.setJobPriority(jobName, oldPriority, newPriority);
        /* code to update priority */
        // console.log(newPriority, jobName)
    }
    function getPriority(priority, jobName) {
        const priorityArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return <TextField
            id="priority"
            select
            // label="Native select"
            defaultValue={priority}
            onChange={(e) => handleChange(e, jobName, priority)}
            SelectProps={{
                native: true,
            }}
            helperText="Please select your currency"
        >
            {priorityArr.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </TextField>
    }

    return (
        <TableContainer component={Paper}>
            <Table className={classes.table} size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell>Job</TableCell>
                        <TableCell align="right">Status</TableCell>
                        <TableCell align="right">Priority(0-10)</TableCell>
                        <TableCell align="right">Total Halts</TableCell>
                        <TableCell align="right">Action</TableCell>
                        {/* <TableCell align="right">Protein&nbsp;(g)</TableCell> */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.jobs.map((row) => (
                        <TableRow key={row.name}>
                            <TableCell component="th" scope="row">
                                {row.name}
                            </TableCell>
                            <TableCell align="right">{row.status}</TableCell>
                            <TableCell align="right">{getPriority(row.priority, row.name)}</TableCell>
                            <TableCell align="right">{row.totalHalts}</TableCell>
                            <TableCell align="right">
                                {
                                    row.status === 'abort' ?
                                        <Button color="primary" size="small" onClick={() => props.forceStartJob(row.name)}>Force Start</Button>
                                        : null
                                }
                                {
                                    row.status !== 'abort' ?
                                        <Button color="secondary" variant="contained" size="small" onClick={() => props.abortJob(row.name)}>Abort</Button>
                                        : null
                                }
                            </TableCell>
                            {/* <TableCell align="right">{row.protein}</TableCell> */}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
