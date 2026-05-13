import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchPrescriptionsList,
  finishPrescription,
  setListFilters,
} from "../../store/slices/prescriptionSlice";
import { ROUTES } from "../../routePaths";
import "./PrescriptionsPage.css";

function statusLabel(s: string | undefined): string {
  const m: Record<string, string> = {
    draft: "Черновик",
    formed: "Сформирован",
    completed: "Завершён",
    rejected: "Отклонён",
    deleted: "Удалён",
  };
  return s ? m[s] ?? s : "—";
}

const POLLING_MS = 4000;

export default function PrescriptionsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isModerator } = useAppSelector((s) => s.user);
  const { list, listLoading, listError, filters, itemMutationLoading } = useAppSelector(
    (s) => s.prescription,
  );
  const [creatorFilter, setCreatorFilter] = useState("");
  const [draftFrom, setDraftFrom] = useState(filters.fromDate);
  const [draftTo, setDraftTo] = useState(filters.toDate);
  const [draftStatus, setDraftStatus] = useState(filters.status);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftFrom(filters.fromDate);
    setDraftTo(filters.toDate);
    setDraftStatus(filters.status);
  }, [filters.fromDate, filters.toDate, filters.status]);

  const load = useCallback(() => {
    void dispatch(fetchPrescriptionsList());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
      return;
    }
    load();
    const id = window.setInterval(load, POLLING_MS);
    return () => window.clearInterval(id);
  }, [isAuthenticated, navigate, load]);

  const visible = useMemo(() => {
    const q = creatorFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => (p.creator_login ?? "").toLowerCase().includes(q));
  }, [list, creatorFilter]);

  const handleApplyFilters = () => {
    dispatch(
      setListFilters({
        fromDate: draftFrom,
        toDate: draftTo,
        status: draftStatus,
      }),
    );
    void dispatch(fetchPrescriptionsList());
  };

  const goPrescription = (id: number) => {
    navigate(`/prescriptions/${id}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="prescriptions-page">
      <div className="prescriptions-page__inner">
        <h1 className="prescriptions-page__heading">
          {isModerator ? "Рецепты (модератор)" : "Мои рецепты"}
        </h1>

        <section className="prescriptions-page__filters">
          <div className="prescriptions-page__filter-row">
            <Form.Group className="prescriptions-page__fg">
              <Form.Label>С даты формирования</Form.Label>
              <Form.Control
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="prescriptions-page__fg">
              <Form.Label>По дату формирования</Form.Label>
              <Form.Control
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="prescriptions-page__fg">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">Все</option>
                <option value="draft">Черновик</option>
                <option value="formed">Сформирован</option>
                <option value="completed">Завершён</option>
                <option value="rejected">Отклонён</option>
              </Form.Select>
            </Form.Group>
            {isModerator ? (
              <Form.Group className="prescriptions-page__fg prescriptions-page__fg--grow">
                <Form.Label>Создатель (фильтр на клиенте)</Form.Label>
                <Form.Control
                  type="text"
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  placeholder="Часть логина"
                />
              </Form.Group>
            ) : null}
          </div>
          <Button className="prescriptions-page__apply" onClick={handleApplyFilters}>
            Применить фильтры
          </Button>
        </section>

        {listError ? <div className="prescriptions-page__error">{listError}</div> : null}

        {listLoading && visible.length === 0 ? (
          <div className="prescriptions-page__loader">
            <Spinner animation="border" />
          </div>
        ) : null}

        <div className="prescriptions-page__table-wrap">
          <Table striped bordered hover responsive className="prescriptions-page__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                <th>Создатель</th>
                <th>Создан</th>
                <th>Формирование</th>
                <th>Завершение</th>
                <th>Модератор</th>
                <th>ФИО врача</th>
                {isModerator ? <th>Действия</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const id = row.prescription_id;
                const finBusy = Boolean(itemMutationLoading[`finish-${id}`]);
                return (
                  <tr key={id}>
                    <td>
                      <button
                        type="button"
                        className="prescriptions-page__linkish"
                        onClick={() => goPrescription(id)}
                      >
                        {id}
                      </button>
                    </td>
                    <td>{statusLabel(row.status)}</td>
                    <td>{row.creator_login || "—"}</td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      {row.forming_date
                        ? new Date(row.forming_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td>
                      {row.finish_date
                        ? new Date(row.finish_date).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td>{row.moderator_login ?? "—"}</td>
                    <td>{row.doctor_full_name || "—"}</td>
                    {isModerator ? (
                      <td>
                        {row.status === "formed" ? (
                          <div className="prescriptions-page__actions">
                            <Button
                              size="sm"
                              className="prescriptions-page__btn-finish"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishPrescription({
                                    prescriptionId: id,
                                    status: "completed",
                                  }),
                                )
                              }
                            >
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              className="prescriptions-page__btn-reject"
                              disabled={finBusy}
                              onClick={() =>
                                void dispatch(
                                  finishPrescription({
                                    prescriptionId: id,
                                    status: "rejected",
                                  }),
                                )
                              }
                            >
                              Отклонить
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {!listLoading && visible.length === 0 ? (
          <p className="prescriptions-page__empty">Нет рецептов по текущим условиям.</p>
        ) : null}
      </div>
    </div>
  );
}
